"use client";

import { useState } from "react";
import { toast } from "sonner";

import ReviewTable from "./components/ReviewTable";
import DeleteConfirmationModal from "@/components/ui/DeleteConfirmationModal";

import { reviewService } from "@/services/review.service";
import { useResourceList } from "@/hooks/useResourceList";

/**
 * Moderation only — an admin can read and remove reviews, never write or
 * edit one. That's the same rule the storefront enforces (reviews are
 * customer-only), so this page has no create/edit modal and doesn't use
 * useCrud like the Master Data pages do.
 */
export default function AdminReviewsPage() {
  const [ratingFilter, setRatingFilter] = useState("");
  const [selectedReview, setSelectedReview] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    items: reviews,
    loading,
    error,
    refetch,
    search,
    setSearch,
    page,
    goToPage,
    pagination,
    sortBy,
    sortOrder,
    handleSort,
  } = useResourceList({
    list: reviewService.listAll,
    entityName: "Review",
    extraParams: { rating: ratingFilter || undefined },
  });

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await reviewService.remove(selectedReview._id);
      toast.success("Review deleted");
      setSelectedReview(null);
      await refetch();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete the review.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Reviews</h1>

        <p className="mt-2 text-neutral-500">
          Read and moderate customer reviews. Reviews can't be written or
          edited from here — only removed.
        </p>
      </div>

      <ReviewTable
        reviews={reviews}
        loading={loading}
        error={error}
        onDelete={setSelectedReview}
        search={search}
        setSearch={setSearch}
        page={page}
        setPage={goToPage}
        pagination={pagination}
        sortBy={sortBy}
        sortOrder={sortOrder}
        handleSort={handleSort}
        ratingFilter={ratingFilter}
        setRatingFilter={setRatingFilter}
      />

      <DeleteConfirmationModal
        isOpen={Boolean(selectedReview)}
        onClose={() => setSelectedReview(null)}
        onConfirm={handleDelete}
        title="Delete Review"
        message={`Delete ${selectedReview?.user?.name || "this customer"}'s review of "${selectedReview?.product?.name || "this product"}"? This can't be undone.`}
        confirmText="Delete"
        isSubmitting={isDeleting}
      />
    </div>
  );
}
