import crypto from "node:crypto";
import request from "supertest";
import app from "../src/app.js";
import Order from "../src/models/order.model.js";
import User from "../src/models/user.model.js";
import ProductVariant from "../src/models/productVariant.model.js";
import { connectTestDB, clearTestDB, disconnectTestDB } from "./setup/testDb.js";
import { createMasterData, createTestProduct } from "./fixtures/masterData.js";

beforeAll(async () => {
  await connectTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

const sign = (rawBody) =>
  crypto.createHmac("sha256", WEBHOOK_SECRET).update(rawBody).digest("hex");

// Posts a payload the same way Razorpay's own webhook call would: a raw
// JSON string, Content-Type: application/json, and a signature header
// computed over those exact bytes — the same shape payment.routes.js's
// express.raw() expects (ADR-067). An intentionally wrong signature can
// be passed in to exercise the rejection path.
const postWebhook = (payload, { signature } = {}) => {
  const rawBody = JSON.stringify(payload);
  return request(app)
    .post("/api/payments/webhook")
    .set("Content-Type", "application/json")
    .set("x-razorpay-signature", signature ?? sign(rawBody))
    .send(rawBody);
};

const capturedEvent = ({ razorpayOrderId, paymentId = "pay_test_captured1", amount }) => ({
  entity: "event",
  account_id: "acc_test",
  event: "payment.captured",
  contains: ["payment"],
  payload: {
    payment: {
      entity: {
        id: paymentId,
        entity: "payment",
        amount,
        currency: "INR",
        status: "captured",
        order_id: razorpayOrderId,
        method: "card",
      },
    },
  },
  created_at: Math.floor(Date.now() / 1000),
});

const failedEvent = ({ razorpayOrderId, paymentId = "pay_test_failed1", amount }) => ({
  entity: "event",
  account_id: "acc_test",
  event: "payment.failed",
  contains: ["payment"],
  payload: {
    payment: {
      entity: {
        id: paymentId,
        entity: "payment",
        amount,
        currency: "INR",
        status: "failed",
        order_id: razorpayOrderId,
        method: "card",
        error_code: "BAD_REQUEST_ERROR",
        error_description: "Payment failed (simulated for test).",
      },
    },
  },
  created_at: Math.floor(Date.now() / 1000),
});

const setupVariant = async () => {
  const { category, brand, roomType, material, color } = await createMasterData();
  const product = await createTestProduct({ category, brand, roomType });
  const variant = await ProductVariant.create({
    product: product._id,
    sku: "WEBHOOK-TEST-SKU-0001",
    price: 500000,
    material: material._id,
    color: color._id,
    stock: 5,
  });
  return variant;
};

// Mirrors order.test.js's own createTestOrder helper — builds a real
// Order directly rather than going through checkout, since these tests
// are about the webhook's own effect on an already-existing order, not
// about how that order got created.
const createRazorpayOrder = async (variant, overrides = {}) => {
  const user = await User.create({
    name: "Customer",
    email: `customer-${Date.now()}-${Math.random()}@test.com`,
    password: "testpassword123",
    role: "customer",
  });

  return Order.create({
    user: user._id,
    items: [
      {
        variant: variant._id,
        product: variant.product,
        name: "Test Sofa",
        sku: variant.sku,
        image: "",
        material: "Sheesham Wood",
        color: "Walnut Brown",
        price: variant.price,
        quantity: 1,
      },
    ],
    shippingAddress: {
      fullName: "Nikhil Choudhary",
      phone: "9876543210",
      addressLine: "221B Baker Colony, Sector 12",
      city: "Jaipur",
      state: "Rajasthan",
      pincode: "302012",
      country: "India",
      addressType: "Home",
      landmark: "",
    },
    paymentMethod: "Razorpay",
    paymentStatus: "Pending",
    razorpayOrderId: "order_test_abc123",
    status: "Pending",
    subtotal: variant.price,
    shippingFee: 0,
    total: variant.price,
    ...overrides,
  });
};

describe("POST /api/payments/webhook — signature verification", () => {
  it("rejects a call with no signature header at all", async () => {
    const res = await request(app)
      .post("/api/payments/webhook")
      .set("Content-Type", "application/json")
      .send(JSON.stringify(capturedEvent({ razorpayOrderId: "order_test_abc123", amount: 1 })));

    expect(res.status).toBe(400);
  });

  it("rejects a call with an invalid signature", async () => {
    const variant = await setupVariant();
    const order = await createRazorpayOrder(variant);

    const res = await postWebhook(
      capturedEvent({ razorpayOrderId: order.razorpayOrderId, amount: order.total }),
      { signature: "0".repeat(64) },
    );

    expect(res.status).toBe(400);

    const orderInDb = await Order.findById(order._id);
    expect(orderInDb.paymentStatus).toBe("Pending"); // untouched
  });

  it("rejects a signature computed with the wrong secret", async () => {
    const variant = await setupVariant();
    const order = await createRazorpayOrder(variant);

    const payload = capturedEvent({ razorpayOrderId: order.razorpayOrderId, amount: order.total });
    const wrongSignature = crypto
      .createHmac("sha256", "a-completely-different-secret")
      .update(JSON.stringify(payload))
      .digest("hex");

    const res = await postWebhook(payload, { signature: wrongSignature });

    expect(res.status).toBe(400);
  });
});

describe("POST /api/payments/webhook — payment.captured", () => {
  it("accepts a validly-signed event and marks the order Paid", async () => {
    const variant = await setupVariant();
    const order = await createRazorpayOrder(variant);

    const res = await postWebhook(
      capturedEvent({
        razorpayOrderId: order.razorpayOrderId,
        paymentId: "pay_test_xyz789",
        amount: order.total,
      }),
    );

    expect(res.status).toBe(200);

    const orderInDb = await Order.findById(order._id);
    expect(orderInDb.paymentStatus).toBe("Paid");
    expect(orderInDb.razorpayPaymentId).toBe("pay_test_xyz789");
    expect(orderInDb.razorpaySignature).toBeTruthy();
    // Payment confirmation doesn't itself touch the delivery lifecycle —
    // that stays admin-driven regardless of payment method (ADR-067).
    expect(orderInDb.status).toBe("Pending");
  });

  it("is idempotent — a duplicate captured event has no double effect", async () => {
    const variant = await setupVariant();
    const order = await createRazorpayOrder(variant);

    const firstPayment = capturedEvent({
      razorpayOrderId: order.razorpayOrderId,
      paymentId: "pay_test_first",
      amount: order.total,
    });
    await postWebhook(firstPayment);

    // Razorpay is free to retry delivery of the same logical event, and
    // in principle a second, distinct payment could even be attempted
    // against the same Razorpay order — either way, once this app has
    // already recorded one "Paid" payment for the order, a later
    // captured event must be a no-op, not a second write that could
    // silently swap in a different payment id.
    const secondPayment = capturedEvent({
      razorpayOrderId: order.razorpayOrderId,
      paymentId: "pay_test_second_should_be_ignored",
      amount: order.total,
    });
    const res = await postWebhook(secondPayment);

    expect(res.status).toBe(200);

    const orderInDb = await Order.findById(order._id);
    expect(orderInDb.paymentStatus).toBe("Paid");
    expect(orderInDb.razorpayPaymentId).toBe("pay_test_first"); // not overwritten
  });

  it("acknowledges (200) but does nothing for an unknown razorpayOrderId", async () => {
    const res = await postWebhook(
      capturedEvent({ razorpayOrderId: "order_does_not_exist", amount: 1000 }),
    );

    expect(res.status).toBe(200);
  });
});

describe("POST /api/payments/webhook — payment.failed", () => {
  it("marks the order Failed, cancels it, and restocks its items", async () => {
    const variant = await setupVariant();
    const stockBefore = variant.stock;
    const order = await createRazorpayOrder(variant);

    // Mirror checkout's own behavior: stock is reserved (decremented) at
    // order-creation time, before payment is confirmed either way.
    await ProductVariant.updateOne({ _id: variant._id }, { $inc: { stock: -1 } });

    const res = await postWebhook(
      failedEvent({ razorpayOrderId: order.razorpayOrderId, amount: order.total }),
    );

    expect(res.status).toBe(200);

    const orderInDb = await Order.findById(order._id);
    expect(orderInDb.paymentStatus).toBe("Failed");
    expect(orderInDb.status).toBe("Cancelled");

    const variantInDb = await ProductVariant.findById(variant._id);
    expect(variantInDb.stock).toBe(stockBefore); // restocked back to its original value
  });

  it("is idempotent — a duplicate failed event has no double effect", async () => {
    const variant = await setupVariant();
    const order = await createRazorpayOrder(variant);
    await ProductVariant.updateOne({ _id: variant._id }, { $inc: { stock: -1 } });

    await postWebhook(failedEvent({ razorpayOrderId: order.razorpayOrderId, amount: order.total }));
    const stockAfterFirst = (await ProductVariant.findById(variant._id)).stock;

    // A second failed event for the same order (Razorpay retrying
    // delivery) must not restock a second time — that would hand back
    // stock that was never actually taken twice.
    const res = await postWebhook(
      failedEvent({ razorpayOrderId: order.razorpayOrderId, amount: order.total }),
    );
    expect(res.status).toBe(200);

    const variantInDb = await ProductVariant.findById(variant._id);
    expect(variantInDb.stock).toBe(stockAfterFirst);
  });

  it("never downgrades an already-Paid order on a late/duplicate failed event", async () => {
    const variant = await setupVariant();
    const order = await createRazorpayOrder(variant);

    await postWebhook(
      capturedEvent({ razorpayOrderId: order.razorpayOrderId, amount: order.total }),
    );

    const res = await postWebhook(
      failedEvent({ razorpayOrderId: order.razorpayOrderId, amount: order.total }),
    );
    expect(res.status).toBe(200);

    const orderInDb = await Order.findById(order._id);
    expect(orderInDb.paymentStatus).toBe("Paid"); // not downgraded to Failed
    expect(orderInDb.status).toBe("Pending"); // not cancelled
  });
});

describe("POST /api/payments/webhook — other event types", () => {
  it("acknowledges (200) a validly-signed event it doesn't act on", async () => {
    const payload = {
      entity: "event",
      event: "order.paid",
      payload: {},
      created_at: Math.floor(Date.now() / 1000),
    };

    const res = await postWebhook(payload);
    expect(res.status).toBe(200);
  });
});
