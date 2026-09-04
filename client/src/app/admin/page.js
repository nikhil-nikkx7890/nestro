"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Boxes, FolderOpen, Package, ShoppingCart } from "lucide-react";

import StatCard from "@/components/ui/StatCard";
import { productService } from "@/services/product.service";
import { categoryService } from "@/services/category.service";
import { brandService } from "@/services/brand.service";
import { materialService } from "@/services/material.service";

/**
 * Every number here is read from the API, never hardcoded. This page
 * previously shipped invented figures ("Orders 256", "Revenue $12,345",
 * and three fake recent orders with customer names) — the exact kind of
 * fabricated content ADR-041 rules out, and it was live on the deployed
 * site. Orders and revenue genuinely can't be shown yet because the
 * Commerce phase isn't built, so they say so instead of guessing.
 */
export default function DashboardPage() {
  const [counts, setCounts] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        // limit: 1 — only pagination.total is needed, not the rows.
        const [products, categories, brands, materials] = await Promise.all([
          productService.list({ limit: 1 }),
          categoryService.list({ limit: 1 }),
          brandService.list({ limit: 1 }),
          materialService.list({ limit: 1 }),
        ]);

        setCounts({
          products: products.pagination?.total ?? 0,
          categories: categories.pagination?.total ?? 0,
          brands: brands.pagination?.total ?? 0,
          materials: materials.pagination?.total ?? 0,
        });
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
          An overview of what's currently in the catalog.
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
          title="Categories"
          value={value(counts?.categories)}
          subtitle="Including inactive"
          icon={FolderOpen}
        />

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
          <h2 className="text-lg font-semibold">Orders</h2>

          <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-200 px-6 py-12 text-center">
            <ShoppingCart size={28} className="text-neutral-300" />
            <p className="mt-4 font-medium">No orders yet</p>
            <p className="mt-1 max-w-sm text-sm text-neutral-500">
              Checkout and orders are part of the Commerce phase, which
              isn't built yet — so there's nothing real to show here.
            </p>
          </div>
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
              href="/admin/categories"
              className="block w-full rounded-xl border border-neutral-200 py-3 text-center font-medium transition hover:bg-neutral-100"
            >
              Manage Categories
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
