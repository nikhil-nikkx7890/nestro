"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import { CheckCircle2, Loader2 } from "lucide-react";

import { useRequireCustomer } from "@/hooks/useRequireCustomer";
import { orderService } from "@/services/order.service";
import OrderStatusBadge from "@/components/ui/OrderStatusBadge";
import PaymentStatusPanel from "@/components/ui/PaymentStatusPanel";
import { formatPaise, toTitleCase } from "@/utils/formatters";

// Razorpay's webhook is server-to-server and arrives asynchronously —
// often within a second or two, but this app makes no timing promise.
// Polling for a short, bounded window catches the common case where the
// webhook lands while the shopper is still looking at this exact page,
// without polling forever if it doesn't (ADR-067 already accepts that
// locally, with no public URL for Razorpay to reach, it never will).
const POLL_INTERVAL_MS = 3000;
const MAX_POLLS = 20; // 60 seconds

export default function OrderConfirmationPage() {
  const { ready } = useRequireCustomer();
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const pollCountRef = useRef(0);

  const fetchOrder = useCallback(() => {
    return orderService
      .getById(id)
      .then((res) => {
        setOrder(res.data);
        return res.data;
      })
      .catch(() => {
        setError("Couldn't find that order.");
        return null;
      });
  }, [id]);

  // Category A (ADR-059): fetch-on-mount for the one order this page
  // exists to show — no separate list state, no sessionStorage guard
  // the way the password-reset pages need (this route is meant to be
  // reachable directly, straight off a successful checkout redirect).
  // Kept as one effect (rather than a plain fetch-on-mount plus a
  // separate polling effect keyed on `order`) so starting to poll never
  // depends on effects re-running as `order` itself changes — the
  // interval below decides on its own, from each poll's own result,
  // when to stop.
  useEffect(() => {
    if (!ready || !id) return;

    let cancelled = false;
    let intervalId = null;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrder().then((data) => {
      if (cancelled || !data) return;
      // Polls only while there's genuinely something to wait for: a
      // Razorpay order still "Pending" — never for COD, and never once
      // the webhook (or a retry) has resolved it one way or the other.
      if (data.paymentMethod === "Razorpay" && data.paymentStatus === "Pending") {
        intervalId = setInterval(async () => {
          pollCountRef.current += 1;
          const updated = await fetchOrder();
          if (cancelled) return;
          if (updated?.paymentStatus !== "Pending" || pollCountRef.current >= MAX_POLLS) {
            clearInterval(intervalId);
          }
        }, POLL_INTERVAL_MS);
      }
    });

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [ready, id, fetchOrder]);

  if (!ready || (!order && !error)) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center text-[#78716C] sm:px-10">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center sm:px-10">
        <p className="text-[#78716C]">{error}</p>
        <Link
          href="/account/orders"
          className="mt-4 inline-block text-sm font-medium text-[#8B5E3C] hover:underline"
        >
          View your orders
        </Link>
      </div>
    );
  }

  const isAwaitingPayment = order.paymentMethod === "Razorpay" && order.paymentStatus === "Pending";
  const paymentFailed = order.paymentMethod === "Razorpay" && order.paymentStatus === "Failed";

  const headline = isAwaitingPayment
    ? "Confirming Payment"
    : paymentFailed
      ? "Payment Not Completed"
      : "Order Placed";

  const subcopy = isAwaitingPayment
    ? "Your order has been created — we're confirming your payment now. This usually takes just a few seconds."
    : paymentFailed
      ? "Your order was created, but the payment didn't go through. Retry it below, or choose Cash on Delivery on your next order."
      : order.paymentMethod === "Razorpay"
        ? "Thank you — your payment was successful and your order is confirmed."
        : "Thank you — your order has been placed successfully. Pay on delivery.";

  return (
    <div className="mx-auto max-w-2xl px-6 py-14 sm:px-10">
      <div className="text-center">
        {isAwaitingPayment ? (
          <Loader2 size={48} className="mx-auto animate-spin text-[#8B5E3C]" />
        ) : (
          <CheckCircle2
            size={48}
            className={clsx("mx-auto", paymentFailed ? "text-red-500" : "text-[#8B5E3C]")}
          />
        )}
        <h1 className="mt-4 font-heading text-3xl text-[#1C1917]">{headline}</h1>
        <p className="mt-2 text-[#78716C]">{subcopy}</p>
      </div>

      <div className="mt-10 rounded-2xl border border-[#E7E5E4] p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-[#78716C]">Order</p>
            <p className="font-mono text-sm text-[#1C1917]">{order._id}</p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>

        <div className="mt-6 space-y-3 border-t border-[#E7E5E4] pt-6">
          {order.items.map((item, index) => (
            <div key={index} className="flex justify-between text-sm">
              <div>
                <p className="text-[#1C1917]">{toTitleCase(item.name)}</p>
                <p className="text-[#78716C]">
                  {item.material} &middot; {item.color} &middot; Qty {item.quantity}
                </p>
              </div>
              <span className="font-medium text-[#1C1917]">
                {formatPaise(item.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-6 border-t border-[#E7E5E4] pt-6 text-sm text-[#57534E]">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatPaise(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping</span>
            <span>{order.shippingFee === 0 ? "Free" : formatPaise(order.shippingFee)}</span>
          </div>
          <div className="mt-2 flex justify-between text-base font-semibold text-[#1C1917]">
            <span>Total</span>
            <span>{formatPaise(order.total)}</span>
          </div>
        </div>

        <div className="mt-6 border-t border-[#E7E5E4] pt-6">
          <PaymentStatusPanel order={order} onPossiblyPaid={fetchOrder} />
        </div>

        <div className="mt-6 border-t border-[#E7E5E4] pt-6 text-sm">
          <p className="font-medium text-[#1C1917]">Shipping to</p>
          <p className="mt-1 text-[#44403C]">{order.shippingAddress.fullName}</p>
          <p className="text-[#44403C]">
            {order.shippingAddress.addressLine}
            {order.shippingAddress.landmark ? `, near ${order.shippingAddress.landmark}` : ""}
          </p>
          <p className="text-[#44403C]">
            {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
            {order.shippingAddress.pincode}
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/account/orders"
          className="flex-1 rounded-lg bg-[#8B5E3C] px-5 py-3 text-center text-sm font-medium text-white transition hover:bg-[#6E4A2F]"
        >
          View My Orders
        </Link>
        <Link
          href="/products"
          className="flex-1 rounded-lg border border-[#D6D3D1] px-5 py-3 text-center text-sm font-medium text-[#1C1917] transition hover:bg-[#F5F5F4]"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
