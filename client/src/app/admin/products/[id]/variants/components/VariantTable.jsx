"use client";

import { Search } from "lucide-react";

import VariantRow from "./VariantRow";
import EmptyState from "@/components/ui/EmptyState";
import Pagination from "@/components/ui/Pagination";
import SortableHeader from "@/components/ui/SortableHeader";

export default function VariantTable({
  variants,
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
            placeholder="Search by SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-neutral-900 focus:bg-white"
          />
        </div>
      </div>

      {loading ? (
        <div className="p-10 text-center text-neutral-500">
          Loading variants...
        </div>
      ) : error ? (
        <div className="p-10 text-center text-red-600">{error}</div>
      ) : variants.length === 0 ? (
        <EmptyState
          openModal={onAdd}
          title="No Variants Yet"
          message="Add a variant to make this product purchasable."
          buttonLabel="Add Variant"
        />
      ) : (
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-200 text-left">
              <SortableHeader
                label="SKU"
                field="sku"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
              />

              <th className="px-6 py-4 text-sm font-semibold">Material</th>
              <th className="px-6 py-4 text-sm font-semibold">Color</th>

              <SortableHeader
                label="Price"
                field="price"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
              />

              <SortableHeader
                label="Stock"
                field="stock"
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
              />

              <th className="px-6 py-4 text-sm font-semibold">Status</th>

              <th className="px-6 py-4 text-right text-sm font-semibold">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {variants.map((variant) => (
              <VariantRow
                key={variant._id}
                variant={variant}
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
