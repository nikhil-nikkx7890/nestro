"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";

import { reviewService } from "@/services/review.service";
import { useAuth } from "@/context/AuthContext";
import StarRating from "../../../components/StarRating";

const MIN_COMMENT = 10;
const MAX_COMMENT = 1000;

const formatDate = (value) =>
  new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

/**
 * The review list, the rating breakdown, and the write/edit form for the
 * signed-in customer's own review. Ratings shown anywhere on the
 * storefront come from these documents — nothing here is a hardcoded
 * number (see the ADR refining ADR-041).
 */
export default function ProductReviews({ productId, onSummaryChange }) {
  const { user } = useAuth();
  const router = useRouter();

  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const isCustomer = user?.role === "customer";
  // GET /api/auth/me returns the user as `id` (a Mongoose virtual), while
  // a populated review carries `user._id` — comparing the two shapes
  // directly silently never matches, which showed the "write a review"
  // form to someone who had already reviewed the product.
  const currentUserId = user?.id ?? user?._id;
  const myReview = reviews.find((r) => String(r.user?._id) === String(currentUserId));

  // Held in a ref rather than listed as a dependency: an inline arrow
  // from the parent would get a new identity every render, changing
  // load()'s identity, re-firing the effect below, forever — the same
  // infinite-request loop that hit the admin Variant page once already.
  const onSummaryChangeRef = useRef(onSummaryChange);
  useEffect(() => {
    onSummaryChangeRef.current = onSummaryChange;
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const response = await reviewService.list(productId, { limit: 50 });
      setReviews(response.data);
      setSummary(response.summary);
      onSummaryChangeRef.current?.(response.summary);
    } catch (err) {
      console.error("Failed to load reviews:", err);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    setRating(0);
    setComment("");
    setEditingId(null);
    setFormError("");
  };

  const startEditing = (review) => {
    setEditingId(review._id);
    setRating(review.rating);
    setComment(review.comment);
    setFormError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isCustomer) {
      toast.error("Please log in as a customer to review.");
      router.push("/login");
      return;
    }
    if (rating < 1) {
      setFormError("Pick a rating first.");
      return;
    }
    if (comment.trim().length < MIN_COMMENT) {
      setFormError(`Tell us a little more — at least ${MIN_COMMENT} characters.`);
      return;
    }

    try {
      setSubmitting(true);
      const payload = { rating, comment: comment.trim() };

      if (editingId) {
        await reviewService.update(editingId, payload);
        toast.success("Review updated");
      } else {
        await reviewService.create(productId, payload);
        toast.success("Thanks for the review");
      }

      resetForm();
      await load();
    } catch (err) {
      const message = err?.response?.data?.message || "Couldn't save your review.";
      setFormError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (reviewId) => {
    try {
      await reviewService.remove(reviewId);
      toast.success("Review deleted");
      if (editingId === reviewId) resetForm();
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Couldn't delete the review.");
    }
  };

  return (
    <section className="mt-16 border-t border-[#E7E5E4] pt-12">
      <h2 className="font-heading text-2xl text-[#1C1917] sm:text-3xl">
        Reviews
      </h2>

      {loading && <p className="mt-6 text-[#78716C]">Loading reviews...</p>}

      {!loading && (
        <div className="mt-8 grid gap-12 lg:grid-cols-[320px_1fr]">
          <div>
            {summary?.reviewCount > 0 ? (
              <>
                <div className="flex items-baseline gap-3">
                  <p className="font-heading text-4xl text-[#1C1917]">
                    {summary.averageRating.toFixed(1)}
                  </p>
                  <div>
                    <StarRating rating={summary.averageRating} showCount={false} size={16} />
                    <p className="mt-1 text-sm text-[#78716C]">
                      {summary.reviewCount}{" "}
                      {summary.reviewCount === 1 ? "review" : "reviews"}
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-2">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = summary.distribution[star] ?? 0;
                    const percent = summary.reviewCount
                      ? (count / summary.reviewCount) * 100
                      : 0;
                    return (
                      <div key={star} className="flex items-center gap-3 text-xs text-[#78716C]">
                        <span className="w-3">{star}</span>
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#E7E5E4]">
                          <div
                            className="h-full rounded-full bg-[#B8863B]"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="w-6 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <p className="text-[#78716C]">
                No reviews yet. If you've bought this, you'd be the first.
              </p>
            )}

            {/* An admin is explicitly forbidden from reviewing (the same
                customer-only rule Cart and Wishlist use), so they get a
                note rather than a form that would 403 on submit. */}
            {user?.role === "admin" && (
              <p className="mt-10 rounded-lg border border-[#E7E5E4] bg-white/60 px-4 py-3 text-sm text-[#78716C]">
                Admin accounts can't post reviews — you can remove any
                review from the list.
              </p>
            )}

            {/* Signed-out visitors do see the form and are sent to login
                on submit, rather than the form being hidden — hiding it
                makes the feature look absent instead of gated. */}
            {user?.role !== "admin" && (!myReview || editingId) && (
              <form onSubmit={handleSubmit} className="mt-10">
                <p className="text-sm font-medium text-[#1C1917]">
                  {editingId ? "Edit your review" : "Write a review"}
                </p>

                <div className="mt-3">
                  <StarRating rating={rating} onChange={setRating} size={24} />
                </div>

                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  maxLength={MAX_COMMENT}
                  placeholder="What stood out — build, finish, delivery?"
                  className="mt-4 w-full rounded-lg border border-[#D6D3D1] bg-white px-4 py-3 text-sm text-[#1C1917] outline-none transition placeholder:text-[#A8A29E] focus:border-[#8B5E3C]"
                />

                {formError && <p className="mt-2 text-xs text-red-600">{formError}</p>}

                <div className="mt-3 flex gap-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-lg bg-[#8B5E3C] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[#6E4A2F] disabled:opacity-50"
                  >
                    {submitting ? "Saving..." : editingId ? "Save changes" : "Post review"}
                  </button>

                  {editingId && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="rounded-lg border border-[#D6D3D1] px-5 py-2.5 text-sm text-[#57534E] transition hover:border-[#8B5E3C]"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>

          <div>
            {reviews.length === 0 ? (
              <p className="text-[#78716C]">Nothing here yet.</p>
            ) : (
              <ul className="space-y-8">
                {reviews.map((review) => {
                  const isMine = String(review.user?._id) === String(currentUserId);
                  // An admin can remove any review (moderation); a
                  // customer only their own.
                  const canDelete = isMine || user?.role === "admin";

                  return (
                    <li key={review._id} className="border-b border-[#E7E5E4] pb-8 last:border-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <StarRating rating={review.rating} showCount={false} size={14} />
                          <p className="mt-2 font-medium text-[#1C1917]">
                            {review.user?.name || "Customer"}
                            {isMine && (
                              <span className="ml-2 text-xs font-normal text-[#8B5E3C]">
                                Your review
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-[#A8A29E]">
                            {formatDate(review.createdAt)}
                          </p>
                        </div>

                        {(isMine || canDelete) && (
                          <div className="flex shrink-0 gap-1">
                            {isMine && (
                              <button
                                type="button"
                                onClick={() => startEditing(review)}
                                aria-label="Edit your review"
                                className="p-2 text-[#78716C] transition hover:text-[#8B5E3C]"
                              >
                                <Pencil size={15} />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                type="button"
                                onClick={() => handleDelete(review._id)}
                                aria-label="Delete review"
                                className="p-2 text-[#78716C] transition hover:text-red-600"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      <p className="mt-3 leading-relaxed text-[#57534E]">
                        {review.comment}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
