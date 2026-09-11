"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import { orderService } from "@/services/order.service";
import OrderStatusBadge from "@/components/ui/OrderStatusBadge";
import PaymentStatusBadge from "@/components/ui/PaymentStatusBadge";
import DeleteConfirmationModal from "@/components/ui/DeleteConfirmationModal";
import { formatPaise, toTitleCase } from "@/utils/formatters";
import { formatOrderStatus, getNextStatusOptions } from "@/utils/orderStatus";

const formatDate = (value) =>
  new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

// The two branches that restock and end the order's life get a
// confirmation step — the forward stages (Confirmed, Processing, ...)
// don't, since they're just visibility updates with no inventory effect.
const CONFIRM_BEFORE = ["Cancelled", "Returned"];

export default function AdminOrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [pendingStatus, setPendingStatus] = useState(null); // status awaiting confirmation
  const [isUpdating, setIsUpdating] = useState(false);

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
    if (!id) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrder();
  }, [id, fetchOrder]);

  const applyStatus = async (nextStatus) => {
    setIsUpdating(true);
    try {
      await orderService.updateStatus(id, nextStatus);
      toast.success(`Order marked ${formatOrderStatus(nextStatus)}.`);
      setPendingStatus(null);
      await fetchOrder();
    } catch (err) {
      const message =
        err?.response?.data?.message || "Failed to update this order. Please try again.";
      toast.error(message);
    } finally {
      setIsUpdating(false);
    }
  };

  const onStatusClick = (nextStatus) => {
    if (CONFIRM_BEFORE.includes(nextStatus)) {
      setPendingStatus(nextStatus);
    } else {
      applyStatus(nextStatus);
    }
  };

  if (!order && !error) {
    return <div className="text-center text-neutral-500">Loading...</div>;
  }

  if (error) {
    return (
      <div className="space-y-4">
        <p className="text-neutral-500">{error}</p>
        <button
          onClick={() => router.push("/admin/orders")}
          className="text-sm font-medium text-neutral-900 hover:underline"
        >
          Back to Orders
        </button>
      </div>
    );
  }

  const nextOptions = getNextStatusOptions(order.status);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Order Details</h1>
          <p className="mt-1 font-mono text-xs text-neutral-500">{order._id}</p>
        </div>
        <OrderStatusBadge status={order.status} className="text-sm" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Items</h2>
            <div className="mt-4 space-y-3">
              {order.items.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between border-b border-neutral-100 pb-3 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium">{toTitleCase(item.name)}</p>
                    <p className="text-sm text-neutral-500">
                      {item.material} &middot; {item.color} &middot; SKU {item.sku} &middot; Qty{" "}
                      {item.quantity}
                    </p>
                  </div>
                  <span className="font-medium">{formatPaise(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-1 border-t border-neutral-200 pt-4 text-sm text-neutral-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatPaise(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{order.shippingFee === 0 ? "Free" : formatPaise(order.shippingFee)}</span>
              </div>
              <div className="flex justify-between text-base font-semibold text-neutral-900">
                <span>Total</span>
                <span>{formatPaise(order.total)}</span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-neutral-500">Payment</span>
                <PaymentStatusBadge
                  paymentMethod={order.paymentMethod}
                  paymentStatus={order.paymentStatus}
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Shipping Address</h2>
            <div className="mt-3 text-sm text-neutral-600">
              <p className="font-medium text-neutral-900">{order.shippingAddress.fullName}</p>
              <p>
                {order.shippingAddress.addressLine}
                {order.shippingAddress.landmark
                  ? `, near ${order.shippingAddress.landmark}`
                  : ""}
              </p>
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                {order.shippingAddress.pincode}
              </p>
              <p>{order.shippingAddress.country}</p>
              <p className="mt-1">Phone: {order.shippingAddress.phone}</p>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Customer</h2>
            <p className="mt-3 text-sm font-medium">{order.user?.name || "Deleted user"}</p>
            {order.user?.email && (
              <p className="text-sm text-neutral-500">{order.user.email}</p>
            )}
            <p className="mt-3 text-xs text-neutral-500">Placed {formatDate(order.createdAt)}</p>
            <p className="text-xs text-neutral-500">Updated {formatDate(order.updatedAt)}</p>
          </section>

          <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Update Status</h2>
            {nextOptions.length === 0 ? (
              <p className="mt-3 text-sm text-neutral-500">
                {order.status} is a final state — nothing further to move it to.
              </p>
            ) : (
              <div className="mt-4 space-y-2">
                {nextOptions.map((status) => (
                  <button
                    key={status}
                    type="button"
                    disabled={isUpdating}
                    onClick={() => onStatusClick(status)}
                    className={
                      CONFIRM_BEFORE.includes(status)
                        ? "w-full rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                        : "w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
                    }
                  >
                    Mark {formatOrderStatus(status)}
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={Boolean(pendingStatus)}
        onClose={() => setPendingStatus(null)}
        onConfirm={() => applyStatus(pendingStatus)}
        title={`Mark this order ${pendingStatus ? formatOrderStatus(pendingStatus) : ""}?`}
        message={
          pendingStatus === "Cancelled"
            ? "This cancels the order and restocks its items."
            : "This marks the order returned and restocks its items."
        }
        confirmText={`Mark ${pendingStatus ? formatOrderStatus(pendingStatus) : ""}`}
        submittingText="Updating..."
        isSubmitting={isUpdating}
      />
    </div>
  );
}
