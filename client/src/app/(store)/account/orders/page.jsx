"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { useRequireCustomer } from "@/hooks/useRequireCustomer";
import { orderService } from "@/services/order.service";
import OrderStatusBadge from "@/components/ui/OrderStatusBadge";
import { formatPaise, toTitleCase } from "@/utils/formatters";

export default function OrderHistoryPage() {
  const { ready } = useRequireCustomer();
  const [orders, setOrders] = useState(null);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await orderService.list();
      setOrders(res.data);
    } catch (error) {
      toast.error("Failed to load your orders. Please try again.");
    }
  }, []);

  // Category A (ADR-059): fetch-on-mount, same shape as CartContext's
  // own suppressed effect and the addresses page's own fetchAddresses.
  useEffect(() => {
    if (!ready) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrders();
  }, [ready, fetchOrders]);

  if (!ready || orders === null) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center text-[#78716C] sm:px-10">
        Loading...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-16 sm:px-10 sm:py-20">
      <p className="text-xs uppercase tracking-[0.2em] text-[#8B5E3C]">Account</p>
      <div className="mt-4 flex items-center justify-between">
        <h1 className="font-heading text-4xl text-[#1C1917]">Your Orders</h1>
        <Link href="/account" className="text-sm font-medium text-[#8B5E3C] hover:underline">
          Back to profile
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-[#E7E5E4] p-6 text-center">
          <p className="text-sm text-[#78716C]">You haven&apos;t placed any orders yet.</p>
          <Link
            href="/products"
            className="mt-4 inline-block text-sm font-medium text-[#8B5E3C] hover:underline"
          >
            Start shopping
          </Link>
        </div>
      ) : (
        <div className="mt-10 space-y-4">
          {orders.map((order) => (
            <Link
              key={order._id}
              href={`/account/orders/${order._id}`}
              className="block rounded-2xl border border-[#E7E5E4] p-6 transition hover:border-[#D6D3D1]"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-[#78716C]">
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

              <p className="mt-3 text-sm text-[#44403C]">
                {order.items
                  .slice(0, 2)
                  .map((item) => toTitleCase(item.name))
                  .join(", ")}
                {order.items.length > 2 ? `, +${order.items.length - 2} more` : ""}
              </p>

              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm text-[#78716C]">
                  {order.items.length} {order.items.length === 1 ? "item" : "items"}
                </span>
                <span className="font-medium text-[#1C1917]">{formatPaise(order.total)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
