import Order from "../models/order.model.js";
import { restockOrderItems } from "./order.controller.js";
import { verifyWebhookSignature } from "../utils/razorpay.js";
import AppError from "../utils/AppError.js";

const extractPayment = (payload) => payload?.payload?.payment?.entity;

/**
 * The only path that ever moves a Razorpay order to "Paid" (ADR-067) —
 * checkout itself only ever leaves paymentStatus at "Pending". Idempotent
 * by checking the current state before writing: Razorpay retries webhook
 * delivery until it receives a 200, and can genuinely deliver the same
 * `payment.captured` event more than once, so re-processing one for an
 * order that's already "Paid" must be a no-op rather than a second write.
 */
const handlePaymentCaptured = async (payload, signature) => {
  const payment = extractPayment(payload);
  if (!payment?.order_id) return;

  const order = await Order.findOne({ razorpayOrderId: payment.order_id });
  // Unknown order (a stale/foreign event, or the DB row genuinely doesn't
  // exist) — acknowledged with 200 either way so Razorpay doesn't retry
  // forever over something that will never resolve differently.
  if (!order) return;

  if (order.paymentStatus === "Paid") return;

  order.paymentStatus = "Paid";
  order.razorpayPaymentId = payment.id;
  order.razorpaySignature = signature;
  await order.save();
};

/**
 * A payment that never completed shouldn't hold stock reserved against a
 * transaction that isn't going to finish, so this gets the same
 * treatment as a customer cancellation: restock every line and mark the
 * order Cancelled (ADR-067's own call — the ADR itself only commits to
 * "handled sensibly," this is what that sensibly means in code). Guarded
 * against re-running for the same reasons as the captured branch above,
 * plus one more: a "Paid" order must never be downgraded by a late or
 * duplicate "failed" event for what was, in reality, a payment that
 * eventually succeeded.
 */
const handlePaymentFailed = async (payload, signature) => {
  const payment = extractPayment(payload);
  if (!payment?.order_id) return;

  const order = await Order.findOne({ razorpayOrderId: payment.order_id });
  if (!order) return;

  if (order.paymentStatus === "Paid" || order.paymentStatus === "Failed") return;

  order.paymentStatus = "Failed";
  order.razorpayPaymentId = payment.id;
  order.razorpaySignature = signature;
  order.status = "Cancelled";
  await order.save();
  await restockOrderItems(order.items);
};

/**
 * POST /api/payments/webhook. Unauthenticated by necessity — Razorpay's
 * servers call this directly, with no session cookie to present — so
 * signature verification (not `authenticate`) is what proves a request
 * genuinely came from Razorpay rather than an arbitrary POST aimed at a
 * public endpoint (ADR-067).
 *
 * Only ever reads `req.body` as the raw Buffer express.raw() produced for
 * this one route (see payment.routes.js) — never the parsed JSON the
 * rest of the app gets from express.json(), since Razorpay signs the
 * exact bytes and a re-serialized object wouldn't reproduce them.
 */
export const handleRazorpayWebhook = async (req, res) => {
  const signature = req.headers["x-razorpay-signature"];
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!verifyWebhookSignature(req.body, signature, secret)) {
    throw new AppError("Invalid webhook signature.", 400);
  }

  const payload = JSON.parse(req.body.toString("utf8"));

  if (payload.event === "payment.captured") {
    await handlePaymentCaptured(payload, signature);
  } else if (payload.event === "payment.failed") {
    await handlePaymentFailed(payload, signature);
  }
  // Every other event type this app hasn't subscribed to acting on is
  // still acknowledged with 200 below, not rejected — an unrecognized
  // but validly-signed event is not an error, just nothing this app
  // currently does anything with.

  return res.status(200).json({ success: true });
};
