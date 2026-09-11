"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

import { useRequireCustomer } from "@/hooks/useRequireCustomer";
import { orderService } from "@/services/order.service";
import OrderStatusBadge from "@/components/ui/OrderStatusBadge";
import PaymentStatusPanel from "@/components/ui/PaymentStatusPanel";
import DeleteConfirmationModal from "@/components/ui/DeleteConfirmationModal";
import { formatPaise, toTitleCase } from "@/utils/formatters";

// Mirrors CANCELLABLE_FROM in order.controller.js (ADR-066) — UX only,
// the backend is the real enforcement, so a race between this page's
// stale copy and a since-shipped order just surfaces the backend's own
// error message rather than silently succeeding.
const CANCELLABLE_STATUSES = ["Pending", "Confirmed", "Processing"];

export default function OrderDetailPage() {
  const { ready } = useRequireCustomer();
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const fetchOrder = useCallback(async () => {
    try {
      const res = await orderService.getById(id);
      setOrder(res.data);
      setError("");
    } catch (err) {
      setError("Couldn't find that order.");
    }
  }, [id]);

  // Category A (ADR-059): fetch-on-mount for the one order this page shows.
  useEffect(() => {
    if (!ready || !id) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrder();
  }, [ready, id, fetchOrder]);

  const onConfirmCancel = async () => {
    setIsCancelling(true);
    try {
      await orderService.cancel(id);
      toast.success("Order cancelled.");
      setIsCancelModalOpen(false);
      await fetchOrder();
    } catch (err) {
      const message =
        err?.response?.data?.message || "Failed to cancel this order. Please try again.";
      toast.error(message);
    } finally {
      setIsCancelling(false);
    }
  };

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
          Back to your orders
        </Link>
      </div>
    );
  }

  const canCancel = CANCELLABLE_STATUSES.includes(order.status);

  return (
    <div className="mx-auto max-w-2xl px-6 py-16 sm:px-10 sm:py-20">
      <p className="text-xs uppercase tracking-[0.2em] text-[#8B5E3C]">Account</p>
      <div className="mt-4 flex items-center justify-between">
        <h1 className="font-heading text-3xl text-[#1C1917]">Order Details</h1>
        <Link
          href="/account/orders"
          className="text-sm font-medium text-[#8B5E3C] hover:underline"
        >
          Back to orders
        </Link>
      </div>

      <div className="mt-8 rounded-2xl border border-[#E7E5E4] p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-[#78716C]">
              Placed{" "}
              {new Date(order.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
            <p className="mt-1 font-mono text-xs text-[#78716C]">{order._id}</p>
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
          <p className="mt-1 text-[#78716C]">Phone: {order.shippingAddress.phone}</p>
        </div>
      </div>

      {canCancel && (
        <button
          type="button"
          onClick={() => setIsCancelModalOpen(true)}
          className="mt-6 rounded-lg border border-red-200 px-5 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50"
        >
          Cancel Order
        </button>
      )}

      <DeleteConfirmationModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={onConfirmCancel}
        title="Cancel this order?"
        message="This cancels your order and restocks the items. You'll need to place a new order if you change your mind."
        confirmText="Cancel Order"
        submittingText="Cancelling..."
        isSubmitting={isCancelling}
      />
    </div>
  );
}
