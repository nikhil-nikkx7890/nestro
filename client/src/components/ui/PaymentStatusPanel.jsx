"use client";

import { useState } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { openRazorpayCheckout } from "@/utils/razorpay";
import { formatPaymentSummary } from "@/utils/orderStatus";

/**
 * Payment status line for an order, plus a "Retry Payment" action when a
 * Razorpay order hasn't been paid yet (ADR-067). This is the only
 * client-side recovery this app offers for an abandoned or failed
 * payment attempt: reopening the widget against the SAME Razorpay order
 * id already stored on the order, since Razorpay accepts a new attempt
 * on an order until one actually succeeds — no new backend call needed,
 * everything a retry needs is already on the order object.
 *
 * A retry's own outcome is exactly as provisional as the first attempt's
 * — this never writes to the Order directly, only the webhook does.
 * `onPossiblyPaid` is called after a successful widget close so the
 * parent page can start checking for the webhook's real confirmation
 * (e.g. by polling), not to display "Paid" itself.
 */
export default function PaymentStatusPanel({ order, onPossiblyPaid }) {
  const [isRetrying, setIsRetrying] = useState(false);

  if (order.paymentMethod !== "Razorpay") {
    return <p className="text-xs text-[#78716C]">Payment: {formatPaymentSummary(order)}</p>;
  }

  // Not just "not already Paid" — a Cancelled or Returned order is a
  // dead end regardless of paymentStatus (found in browser verification:
  // cancelling a still-Pending Razorpay order left this button showing,
  // which would let a customer pay against a Razorpay order id whose
  // Nestro Order has already been restocked and closed out).
  const canRetry =
    order.paymentStatus !== "Paid" && order.status !== "Cancelled" && order.status !== "Returned";

  const onRetry = () => {
    setIsRetrying(true);
    openRazorpayCheckout({
      orderId: order.razorpayOrderId,
      amount: order.total,
      currency: "INR",
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      onSuccess: () => {
        toast.success("Payment received — confirming with our server.");
        setIsRetrying(false);
        onPossiblyPaid?.();
      },
      onDismissOrFail: () => {
        toast.error("Payment wasn't completed. You can try again anytime from here.");
        setIsRetrying(false);
      },
    });
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="flex items-center gap-1.5 text-xs text-[#78716C]">
        {order.paymentStatus === "Failed" && (
          <AlertCircle size={14} className="shrink-0 text-red-600" />
        )}
        Payment: {formatPaymentSummary(order)}
      </p>

      {canRetry && (
        <button
          type="button"
          onClick={onRetry}
          disabled={isRetrying}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#8B5E3C] px-3 py-1.5 text-xs font-medium text-[#8B5E3C] transition hover:bg-[#8B5E3C]/5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw size={12} />
          {isRetrying ? "Opening..." : "Retry Payment"}
        </button>
      )}
    </div>
  );
}
