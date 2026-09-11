"use client";

import { useState } from "react";

import OrderTable from "./components/OrderTable";
import { orderService } from "@/services/order.service";
import { useResourceList } from "@/hooks/useResourceList";

/**
 * Read plus one write (status transitions, done from the detail page) —
 * the same "moderation, not full CRUD" shape the Reviews admin page
 * already uses, since an order's items/address/totals are a snapshot
 * (ADR-066) admin was never meant to edit, only move through its
 * lifecycle.
 */
export default function AdminOrdersPage() {
  const [statusFilter, setStatusFilter] = useState("");

  const {
    items: orders,
    loading,
    error,
    page,
    goToPage,
    pagination,
    sortBy,
    sortOrder,
    handleSort,
  } = useResourceList({
    list: orderService.list,
    entityName: "Order",
    extraParams: { status: statusFilter || undefined },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Orders</h1>
        <p className="mt-2 text-neutral-500">
          Every order placed on the storefront, newest first. Open one to move it through its
          status or handle a cancellation/return.
        </p>
      </div>

      <OrderTable
        orders={orders}
        loading={loading}
        error={error}
        page={page}
        setPage={goToPage}
        pagination={pagination}
        sortBy={sortBy}
        sortOrder={sortOrder}
        handleSort={handleSort}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />
    </div>
  );
}
