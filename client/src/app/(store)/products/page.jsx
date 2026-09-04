"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";

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
  inStock: filters.inStock ? "true" : undefined,
});

export default function ProductListingPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-[1440px] px-6 py-14 sm:px-10 text-[#78716C]">Loading products...</div>}>
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

  const [filtersOpen, setFiltersOpen] = useState(false);

  const { items: products, loading, error, pagination, goToPage } = useResourceList({
    list: productService.list,
    entityName: "Product",
    extraParams: buildExtraParams(filters),
  });

  const activeFilterCount =
    (filters.category?.length ?? 0) +
    (filters.brand?.length ?? 0) +
    (filters.roomType?.length ?? 0) +
    (filters.material?.length ?? 0) +
    (filters.color?.length ?? 0) +
    (filters.minPrice ? 1 : 0) +
    (filters.maxPrice ? 1 : 0) +
    (filters.inStock ? 1 : 0);

  // The drawer covers the page on small screens, so the page behind it
  // must not scroll with it — otherwise closing the drawer drops the
  // shopper somewhere else in the list than where they opened it.
  useEffect(() => {
    document.body.style.overflow = filtersOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [filtersOpen]);

  return (
    <div className="mx-auto max-w-[1440px] px-6 py-10 sm:px-10 sm:py-14">
      <div className="mb-8 sm:mb-12">
        <h1 className="font-heading text-3xl text-[#1C1917] sm:text-4xl">Shop All</h1>
        <p className="mt-3 max-w-xl text-[#57534E]">
          Furniture made from considered materials, built to live with for
          years, not seasons.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[280px_1fr]">
        {/* Below lg the filter panel is ~1200px tall, which pushed the
            first product about two screens down the page. It moves into
            an on-demand drawer there and stays an inline sidebar from lg
            up, where there's room for it beside the grid. */}
        <div className="hidden lg:sticky lg:top-8 lg:block lg:self-start">
          <ProductFilters filters={filters} onChange={setFilters} />
        </div>

        <div>
          <div className="mb-6 flex items-center justify-between lg:hidden">
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-[#D6D3D1] px-4 py-3 text-sm font-medium text-[#1C1917] transition hover:border-[#8B5E3C]"
            >
              <SlidersHorizontal size={16} />
              Filters
              {activeFilterCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#8B5E3C] px-1.5 text-xs text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {pagination?.total > 0 && (
              <p className="text-sm text-[#78716C]">{pagination.total} products</p>
            )}
          </div>

          {loading && <p className="text-[#78716C]">Loading products...</p>}

          {error && <p className="text-red-600">{error}</p>}

          {!loading && !error && products.length === 0 && (
            <p className="text-[#78716C]">No products match these filters.</p>
          )}

          {!loading && !error && products.length > 0 && (
            <>
              <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-8 sm:gap-y-12 xl:grid-cols-3 2xl:grid-cols-4">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>

              <StorePagination pagination={pagination} onPageChange={goToPage} />
            </>
          )}
        </div>
      </div>

      {filtersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setFiltersOpen(false)}
            aria-hidden
          />

          <div className="absolute inset-y-0 right-0 flex w-[88%] max-w-sm flex-col bg-[#F8F5F1]">
            <div className="flex items-center justify-between border-b border-[#E7E5E4] px-5 py-4">
              <p className="font-heading text-lg text-[#1C1917]">Filters</p>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                aria-label="Close filters"
                className="-mr-2 p-2 text-[#57534E] transition hover:text-[#8B5E3C]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-6">
              <ProductFilters
                filters={filters}
                onChange={setFilters}
                showHeading={false}
              />
            </div>

            <div className="border-t border-[#E7E5E4] p-4">
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="w-full rounded-lg bg-[#8B5E3C] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#6E4A2F]"
              >
                Show {pagination?.total ?? 0} products
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
