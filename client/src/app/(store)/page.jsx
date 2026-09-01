"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { categoryService } from "@/services/category.service";
import { roomTypeService } from "@/services/roomType.service";
import { productService } from "@/services/product.service";

import HeroCarousel from "./components/HeroCarousel";
import ShopByGrid from "./components/ShopByGrid";
import ProductCard from "./products/components/ProductCard";

export default function HomePage() {
  const [categories, setCategories] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [categoryRes, roomTypeRes, productRes] = await Promise.all([
          categoryService.list({
            limit: 8,
            isActive: true,
            sortBy: "displayOrder",
            sortOrder: "asc",
          }),
          roomTypeService.list({ limit: 8, isActive: true }),
          // optionalAuthenticate already forces status: "published" for an
          // anonymous/customer caller (ADR-036) — no status param needed.
          productService.list({ limit: 8, sortBy: "createdAt", sortOrder: "desc" }),
        ]);
        setCategories(categoryRes.data);
        setRoomTypes(roomTypeRes.data);
        setNewArrivals(productRes.data);
      } catch (err) {
        console.error("Failed to load homepage content:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div>
      {!loading && (
        <>
          <HeroCarousel categories={categories} />

          <ShopByGrid
            title="Shop by Category"
            items={categories}
            hrefFor={(category) => `/products?category=${category._id}`}
          />

          <ShopByGrid
            title="Shop by Room"
            items={roomTypes}
            hrefFor={(roomType) => `/products?roomType=${roomType._id}`}
          />

          {newArrivals.length > 0 && (
            <section className="mx-auto max-w-6xl px-6 py-12 sm:px-10">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-2xl text-[#1C1917]">New Arrivals</h2>
                <Link
                  href="/products"
                  className="text-sm font-medium text-[#8B5E3C] hover:underline"
                >
                  Shop all
                </Link>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
                {newArrivals.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
