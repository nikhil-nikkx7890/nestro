"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

import { categoryService } from "@/services/category.service";
import { roomTypeService } from "@/services/roomType.service";
import { productService } from "@/services/product.service";
import { toTitleCase, formatPaise } from "@/utils/formatters";

import HeroCarousel from "./components/HeroCarousel";
import CategoryStrip from "./components/CategoryStrip";
import RoomMosaic from "./components/RoomMosaic";
import CraftBand from "./components/CraftBand";
import TrustBar from "./components/TrustBar";
import SectionHeading from "./components/SectionHeading";
import ProductCard from "./products/components/ProductCard";

export default function HomePage() {
  const [categories, setCategories] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [totals, setTotals] = useState({ products: 0, categories: 0, roomTypes: 0 });
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
          productService.list({ limit: 9, sortBy: "createdAt", sortOrder: "desc" }),
        ]);
        setCategories(categoryRes.data);
        setRoomTypes(roomTypeRes.data);
        setNewArrivals(productRes.data);
        // Real, computed totals — these feed CraftBand's stats, which
        // stand in for the fabricated business figures the reference
        // design uses there (ADR-041).
        setTotals({
          products: productRes.pagination?.total ?? 0,
          categories: categoryRes.pagination?.total ?? 0,
          roomTypes: roomTypeRes.pagination?.total ?? 0,
        });
      } catch (err) {
        console.error("Failed to load homepage content:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return null;

  const [featured, ...rest] = newArrivals;

  return (
    <div>
      <HeroCarousel categories={categories} />

      <CategoryStrip items={categories} />

      {newArrivals.length > 0 && (
        <section className="mx-auto max-w-[1440px] px-6 py-10 sm:px-10 sm:py-16">
          <SectionHeading
            eyebrow="Just landed"
            title="New Arrivals"
            action={{ label: "Shop all", href: "/products" }}
          />

          {/* Asymmetric on purpose: one large lead card carrying the
              section, the rest in a normal grid beside it. An even grid
              here repeated the shape of every other section on the page. */}
          <div className="mt-10 grid gap-8 lg:grid-cols-[1.15fr_2fr]">
            <Link
              href={`/products/${featured._id}`}
              className="group flex flex-col overflow-hidden rounded-2xl bg-stone-950"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden">
                {featured.images?.[0]?.url ? (
                  <Image
                    src={featured.images[0].url}
                    alt={featured.name}
                    fill
                    sizes="(min-width: 1024px) 35vw, 100vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm text-stone-500">
                    No image
                  </div>
                )}
              </div>

              <div className="p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#D6BFA7]">
                  {featured.category?.name}
                </p>
                <h3 className="mt-3 font-heading text-2xl text-white">
                  {toTitleCase(featured.name)}
                </h3>
                {featured.brand?.name && (
                  <p className="mt-1 text-sm text-stone-400">{featured.brand.name}</p>
                )}
                {featured.fromPrice != null && (
                  <p className="mt-5 text-lg font-semibold text-white">
                    {formatPaise(featured.fromPrice)}
                  </p>
                )}
                <span className="mt-6 inline-block rounded-lg bg-[#8B5E3C] px-6 py-3 text-sm font-medium text-white transition group-hover:bg-[#6E4A2F]">
                  View in Store
                </span>
              </div>
            </Link>

            <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-8 sm:gap-y-12 xl:grid-cols-4">
              {rest.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      <RoomMosaic items={roomTypes} />

      <CraftBand
        image={categories.find((c) => c.image?.url)?.image}
        stats={[
          { value: totals.products, label: "Pieces in catalog" },
          { value: totals.categories, label: "Categories" },
          { value: totals.roomTypes, label: "Rooms" },
        ]}
      />

      {/* Near the bottom on purpose: delivery/returns/warranty answer a
          question a shopper has once they're considering a purchase, not
          the moment they land. The top of the page belongs to the
          catalog. */}
      <TrustBar />
    </div>
  );
}
