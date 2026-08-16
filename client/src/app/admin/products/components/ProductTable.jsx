"use client";

import { Search } from "lucide-react";

import ProductRow from "./ProductRow";
import EmptyState from "@/components/ui/EmptyState";
import Pagination from "@/components/ui/Pagination";
import SortableHeader from "@/components/ui/SortableHeader";

export default function ProductTable({
  products,
  loading,
  error,
  onAdd,
  onEdit,
  onDelete,
  search,
  setSearch,
  page,
  setPage,
  pagination,
  sortBy,
  sortOrder,
  handleSort,
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-neutral-200 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
          />

          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-neutral-900 focus:bg-white"
          />
        </div>
      </div>

      {loading ? (
        <div className="p-10 text-center text-neutral-500">
          Loading products...
        </div>
      ) : error ? (
        <div className="p-10 text-center text-red-600">{error}</div>
      ) : products.length === 0 ? (
        <EmptyState
          openModal={onAdd}
          title="No Products Found"
          message="Create your first product."
          buttonLabel="Add Product"
        />
      ) : (
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-200 text-left">
              <SortableHeader
                label="Product"
                field="name"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
              />

              <th className="px-6 py-4 text-sm font-semibold">Category</th>

              <th className="px-6 py-4 text-sm font-semibold">Brand</th>

              <th className="px-6 py-4 text-sm font-semibold">Variants</th>

              <SortableHeader
                label="Status"
                field="status"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
              />

              <th className="px-6 py-4 text-right text-sm font-semibold">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {products.map((product) => (
              <ProductRow
                key={product._id}
                product={product}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </tbody>
        </table>
      )}
      <Pagination pagination={pagination} onPageChange={setPage} />
    </div>
  );
}
