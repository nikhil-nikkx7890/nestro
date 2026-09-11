"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Boxes, FolderOpen, Package, ShoppingCart, IndianRupee } from "lucide-react";

import StatCard from "@/components/ui/StatCard";
import OrderStatusBadge from "@/components/ui/OrderStatusBadge";
import { productService } from "@/services/product.service";
import { categoryService } from "@/services/category.service";
import { brandService } from "@/services/brand.service";
import { materialService } from "@/services/material.service";
import { orderService } from "@/services/order.service";
import { formatPaise } from "@/utils/formatters";

/**
 * Every number here is read from the API, never hardcoded. This page
 * previously shipped invented figures ("Orders 256", "Revenue $12,345",
 * and three fake recent orders with customer names) — the exact kind of
 * fabricated content ADR-041 rules out, and it was live on the deployed
 * site — replaced with real counts and an honest empty state naming the
 * unbuilt Commerce phase (ADR-055). Commerce Part 2 (ADR-066) built
 * Orders, so this now shows real ones instead of that placeholder.
 */
export default function DashboardPage() {
  const [counts, setCounts] = useState(null);
  const [recentOrders, setRecentOrders] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        // limit: 1 — only pagination.total is needed, not the rows, for
        // the catalog stat cards. Orders needs actual rows too (for the
        // recent-orders list and the revenue sum below), so it asks for
        // more — up to buildQueryFeatures' own MAX_LIMIT (100). Revenue
        // is summed from whatever's returned, not a true unbounded sum —
        // an honest limitation for a store with over 100 orders, not a
        // real concern at this project's actual scale.
        const [products, categories, brands, materials, orders] = await Promise.all([
          productService.list({ limit: 1 }),
          categoryService.list({ limit: 1 }),
          brandService.list({ limit: 1 }),
          materialService.list({ limit: 1 }),
          orderService.list({ limit: 100, sortBy: "createdAt", sortOrder: "desc" }),
        ]);

        const revenue = orders.data
          .filter((order) => order.status !== "Cancelled" && order.status !== "Returned")
          .reduce((sum, order) => sum + order.total, 0);

        setCounts({
          products: products.pagination?.total ?? 0,
          categories: categories.pagination?.total ?? 0,
          brands: brands.pagination?.total ?? 0,
          materials: materials.pagination?.total ?? 0,
          orders: orders.pagination?.total ?? 0,
          revenue,
        });
        setRecentOrders(orders.data.slice(0, 5));
      } catch (err) {
        console.error("Failed to load dashboard stats:", err);
        setError("Couldn't load dashboard stats.");
      }
    };
    load();
  }, []);

  const value = (n) => (counts ? String(n) : "—");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Dashboard</h1>

        <p className="mt-2 text-neutral-500">
          An overview of what’s currently in the catalog.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Products"
          value={value(counts?.products)}
          subtitle="Across every status"
          icon={Package}
        />

        <StatCard
          title="Orders"
          value={value(counts?.orders)}
          subtitle="Every status, all time"
          icon={ShoppingCart}
        />

        <StatCard
          title="Revenue"
          value={counts ? formatPaise(counts.revenue) : "—"}
          subtitle="Excludes cancelled/returned"
          icon={IndianRupee}
        />

        <StatCard
          title="Categories"
          value={value(counts?.categories)}
          subtitle="Including inactive"
          icon={FolderOpen}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Brands"
          value={value(counts?.brands)}
          subtitle="Including inactive"
          icon={Boxes}
        />

        <StatCard
          title="Materials"
          value={value(counts?.materials)}
          subtitle="Including inactive"
          icon={Boxes}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="rounded-2xl border border-neutral-200 bg-white p-6 xl:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Orders</h2>
            {recentOrders && recentOrders.length > 0 && (
              <Link
                href="/admin/orders"
                className="text-sm font-medium text-neutral-900 hover:underline"
              >
                View all
              </Link>
            )}
          </div>

          {recentOrders === null ? (
            <p className="mt-6 text-center text-sm text-neutral-500">Loading...</p>
          ) : recentOrders.length === 0 ? (
            <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-200 px-6 py-12 text-center">
              <ShoppingCart size={28} className="text-neutral-300" />
              <p className="mt-4 font-medium">No orders yet</p>
              <p className="mt-1 max-w-sm text-sm text-neutral-500">
                Orders placed on the storefront will show up here.
              </p>
            </div>
          ) : (
            <div className="mt-4 divide-y divide-neutral-100">
              {recentOrders.map((order) => (
                <Link
                  key={order._id}
                  href={`/admin/orders/${order._id}`}
                  className="flex items-center justify-between gap-3 py-3 transition hover:bg-neutral-50"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {order.user?.name || "Deleted user"}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {order.items.length} item{order.items.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <OrderStatusBadge status={order.status} />
                    <span className="font-medium">{formatPaise(order.total)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-neutral-200 bg-white p-6">
          <h2 className="mb-5 text-lg font-semibold">Quick Actions</h2>

          <div className="space-y-3">
            <Link
              href="/admin/products/new"
              className="block w-full rounded-xl bg-neutral-900 py-3 text-center font-medium text-white transition hover:bg-neutral-800"
            >
              Add Product
            </Link>

            <Link
              href="/admin/orders"
              className="block w-full rounded-xl border border-neutral-200 py-3 text-center font-medium transition hover:bg-neutral-100"
            >
              Manage Orders
            </Link>

            <Link
              href="/products"
              className="block w-full rounded-xl border border-neutral-200 py-3 text-center font-medium transition hover:bg-neutral-100"
            >
              View Storefront
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
