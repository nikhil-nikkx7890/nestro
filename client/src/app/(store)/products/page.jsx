"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

import { productService } from "@/services/product.service";
import { useResourceList } from "@/hooks/useResourceList";

import ProductCard from "./components/ProductCard";
import ProductFilters from "./components/ProductFilters";
import StorePagination from "./components/StorePagination";

// filters (component/page state) always holds arrays per field — the
// multi-select shape ADR-048 introduced. extraParams (what actually goes
// over the wire) is the flat, comma-joined query-param shape the API
// expects (product.controller.js's parseIdList) — kept distinct so
// ProductFilters never has to know about wire format.
const buildExtraParams = (filters) => ({
  category: filters.category?.length ? filters.category.join(",") : undefined,
  brand: filters.brand?.length ? filters.brand.join(",") : undefined,
  roomType: filters.roomType?.length ? filters.roomType.join(",") : undefined,
  material: filters.material?.length ? filters.material.join(",") : undefined,
  color: filters.color?.length ? filters.color.join(",") : undefined,
  minPrice: filters.minPrice || undefined,
  maxPrice: filters.maxPrice || undefined,
});

export default function ProductListingPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-6xl px-6 py-14 sm:px-10 text-[#78716C]">Loading products...</div>}>
      <ProductListingContent />
    </Suspense>
  );
}

// useSearchParams() opts the whole subtree into client-side rendering
// during prerender unless wrapped in Suspense (Next.js App Router
// requirement) — split out so the outer page component can provide that
// boundary without the fallback needing to know about filters/search.
function ProductListingContent() {
  const searchParams = useSearchParams();
  // Seeds the category/roomType filter from a homepage "Shop by
  // Category"/"Shop by Room" link (?category=id / ?roomType=id); only read
  // once on mount, same as useState's lazy initializer — the URL isn't
  // kept in sync with filter changes after that.
  const [filters, setFilters] = useState(() => {
    const category = searchParams.get("category");
    const roomType = searchParams.get("roomType");
    return {
      ...(category ? { category: [category] } : {}),
      ...(roomType ? { roomType: [roomType] } : {}),
    };
  });

  const { items: products, loading, error, pagination, goToPage } = useResourceList({
    list: productService.list,
    entityName: "Product",
    extraParams: buildExtraParams(filters),
  });

  return (
    <div className="mx-auto max-w-6xl px-6 py-14 sm:px-10">
      <div className="mb-12">
        <h1 className="font-heading text-4xl text-[#1C1917]">Shop All</h1>
        <p className="mt-3 max-w-xl text-[#57534E]">
          Furniture made from considered materials, built to live with for
          years, not seasons.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[240px_1fr]">
        <div className="lg:sticky lg:top-8 lg:self-start">
          <ProductFilters filters={filters} onChange={setFilters} />
        </div>

        <div>
          {loading && <p className="text-[#78716C]">Loading products...</p>}

          {error && <p className="text-red-600">{error}</p>}

          {!loading && !error && products.length === 0 && (
            <p className="text-[#78716C]">No products match these filters.</p>
          )}

          {!loading && !error && products.length > 0 && (
            <>
              <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>

              <StorePagination pagination={pagination} onPageChange={goToPage} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
