"use client";

import Link from "next/link";
import { Eye } from "lucide-react";

import Pagination from "@/components/ui/Pagination";
import SortableHeader from "@/components/ui/SortableHeader";
import OrderStatusBadge from "@/components/ui/OrderStatusBadge";
import { ORDER_STATUSES } from "@/utils/orderStatus";
import { formatPaise } from "@/utils/formatters";

const formatDate = (value) =>
  new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export default function OrderTable({
  orders,
  loading,
  error,
  pagination,
  page,
  setPage,
  sortBy,
  sortOrder,
  handleSort,
  statusFilter,
  setStatusFilter,
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-neutral-200 p-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-neutral-500">
          {pagination.total} order{pagination.total === 1 ? "" : "s"}
        </p>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by status"
          className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm outline-none transition focus:border-neutral-900 focus:bg-white"
        >
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="p-10 text-center text-neutral-500">Loading orders...</div>
      ) : error ? (
        <div className="p-10 text-center text-red-600">{error}</div>
      ) : orders.length === 0 ? (
        <div className="p-10 text-center">
          <p className="font-medium">No orders found</p>
          <p className="mt-1 text-sm text-neutral-500">
            {statusFilter ? "Nothing matches this filter." : "No customer has ordered yet."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead>
              <tr className="border-b border-neutral-200 text-left">
                <th className="px-6 py-4 text-sm font-semibold">Order</th>
                <th className="px-6 py-4 text-sm font-semibold">Customer</th>
                <th className="px-6 py-4 text-sm font-semibold">Items</th>
                <SortableHeader
                  label="Total"
                  field="total"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                />
                <th className="px-6 py-4 text-sm font-semibold">Status</th>
                <SortableHeader
                  label="Placed"
                  field="createdAt"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                />
                <th className="px-6 py-4 text-right text-sm font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody>
              {orders.map((order) => (
                <tr key={order._id} className="border-b border-neutral-100 last:border-0">
                  <td className="whitespace-nowrap px-6 py-4 font-mono text-xs text-neutral-500">
                    {order._id.slice(-8)}
                  </td>

                  <td className="px-6 py-4">
                    <p className="whitespace-nowrap font-medium">
                      {order.user?.name || "Deleted user"}
                    </p>
                    {order.user?.email && (
                      <p className="text-xs text-neutral-500">{order.user.email}</p>
                    )}
                  </td>

                  <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-600">
                    {order.items.length}
                  </td>

                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                    {formatPaise(order.total)}
                  </td>

                  <td className="whitespace-nowrap px-6 py-4">
                    <OrderStatusBadge status={order.status} />
                  </td>

                  <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-500">
                    {formatDate(order.createdAt)}
                  </td>

                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/admin/orders/${order._id}`}
                      aria-label="View order"
                      className="inline-block rounded-lg p-2 text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900"
                    >
                      <Eye size={16} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination pagination={pagination} onPageChange={setPage} />
    </div>
  );
}
