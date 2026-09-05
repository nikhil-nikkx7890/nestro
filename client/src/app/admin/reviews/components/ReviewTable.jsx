"use client";

import { Search, Star, Trash2 } from "lucide-react";

import Pagination from "@/components/ui/Pagination";
import SortableHeader from "@/components/ui/SortableHeader";

const formatDate = (value) =>
  new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

function Stars({ rating }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={13}
          className={star <= rating ? "text-amber-500" : "text-neutral-300"}
          fill={star <= rating ? "currentColor" : "none"}
        />
      ))}
    </span>
  );
}

export default function ReviewTable({
  reviews,
  loading,
  error,
  onDelete,
  search,
  setSearch,
  pagination,
  page,
  setPage,
  sortBy,
  sortOrder,
  handleSort,
  ratingFilter,
  setRatingFilter,
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
            placeholder="Search review text..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-neutral-900 focus:bg-white"
          />
        </div>

        {/* Low ratings are where moderation attention usually goes, so
            filtering by star level is the one filter this page needs. */}
        <select
          value={ratingFilter}
          onChange={(e) => setRatingFilter(e.target.value)}
          aria-label="Filter by rating"
          className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm outline-none transition focus:border-neutral-900 focus:bg-white"
        >
          <option value="">All ratings</option>
          <option value="5">5 stars</option>
          <option value="4">4 stars</option>
          <option value="3">3 stars</option>
          <option value="2">2 stars</option>
          <option value="1">1 star</option>
        </select>
      </div>

      {loading ? (
        <div className="p-10 text-center text-neutral-500">Loading reviews...</div>
      ) : error ? (
        <div className="p-10 text-center text-red-600">{error}</div>
      ) : reviews.length === 0 ? (
        <div className="p-10 text-center">
          <p className="font-medium">No reviews found</p>
          <p className="mt-1 text-sm text-neutral-500">
            {search || ratingFilter
              ? "Nothing matches this search or filter."
              : "No customer has reviewed a product yet."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead>
              <tr className="border-b border-neutral-200 text-left">
                <SortableHeader
                  label="Rating"
                  field="rating"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                />

                <th className="px-6 py-4 text-sm font-semibold">Product</th>

                <th className="px-6 py-4 text-sm font-semibold">Customer</th>

                <th className="px-6 py-4 text-sm font-semibold">Comment</th>

                <SortableHeader
                  label="Posted"
                  field="createdAt"
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
              {reviews.map((review) => (
                <tr key={review._id} className="border-b border-neutral-100 last:border-0">
                  <td className="whitespace-nowrap px-6 py-4">
                    <Stars rating={review.rating} />
                  </td>

                  <td className="px-6 py-4">
                    <p className="whitespace-nowrap font-medium">
                      {review.product?.name || "Deleted product"}
                    </p>
                    {review.product?.status && review.product.status !== "published" && (
                      <span className="text-xs capitalize text-neutral-500">
                        {review.product.status}
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    <p className="whitespace-nowrap">{review.user?.name || "Deleted user"}</p>
                    {review.user?.email && (
                      <p className="text-xs text-neutral-500">{review.user.email}</p>
                    )}
                  </td>

                  <td className="max-w-md px-6 py-4 text-sm text-neutral-600">
                    {review.comment}
                  </td>

                  <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-500">
                    {formatDate(review.createdAt)}
                  </td>

                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => onDelete(review)}
                      aria-label={`Delete review by ${review.user?.name || "customer"}`}
                      className="rounded-lg p-2 text-neutral-500 transition hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination pagination={pagination} onPageChange={setPage} />
    </div>
  );
}
