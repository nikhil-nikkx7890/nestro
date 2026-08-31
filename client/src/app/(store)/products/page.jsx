"use client";

import { productService } from "@/services/product.service";
import { useResourceList } from "@/hooks/useResourceList";

import ProductCard from "./components/ProductCard";
import StorePagination from "./components/StorePagination";

export default function ProductListingPage() {
  const { items: products, loading, error, pagination, goToPage } = useResourceList({
    list: productService.list,
    entityName: "Product",
  });

  return (
    <div className="mx-auto max-w-6xl px-6 py-14 sm:px-10">
      <div className="mb-12">
        <h1 className="font-heading text-4xl text-[#2B2621]">Shop All</h1>
        <p className="mt-3 max-w-xl text-[#5A5147]">
          Furniture made from considered materials, built to live with for
          years, not seasons.
        </p>
      </div>

      {loading && <p className="text-[#8A8071]">Loading products...</p>}

      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && products.length === 0 && (
        <p className="text-[#8A8071]">No products available right now.</p>
      )}

      {!loading && !error && products.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>

          <StorePagination pagination={pagination} onPageChange={goToPage} />
        </>
      )}
    </div>
  );
}
