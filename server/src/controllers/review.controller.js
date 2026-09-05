import mongoose from "mongoose";
import Review from "../models/review.model.js";
import Product from "../models/product.model.js";
import AppError from "../utils/AppError.js";
import { buildQueryFeatures } from "../utils/buildQueryFeatures.js";

/**
 * Shared guard: the product must exist, and a non-admin caller must not
 * be able to reach an unpublished one — the same 404-for-everything rule
 * getProductById uses (ADR-036), so reviews can't be used to probe which
 * draft products exist.
 */
const findVisibleProduct = async (productId, user) => {
  const product = await Product.findById(productId).select("status");

  if (!product) {
    throw new AppError("Product not found.", 404);
  }
  if (user?.role !== "admin" && product.status !== "published") {
    throw new AppError("Product not found.", 404);
  }

  return product;
};

export const getProductReviews = async (req, res) => {
  const { productId } = req.params;
  const { sort, skip, limit, page } = buildQueryFeatures(req.query, {
    sortableFields: ["createdAt", "rating"],
    defaultSortBy: "createdAt",
    defaultSortOrder: "desc",
  });

  await findVisibleProduct(productId, req.user);

  const [reviews, total, summary] = await Promise.all([
    Review.find({ product: productId })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate("user", "name"),
    Review.countDocuments({ product: productId }),
    getReviewSummary(productId),
  ]);

  return res.status(200).json({
    success: true,
    data: reviews,
    summary,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
};

/**
 * averageRating/reviewCount for one product, plus the count at each star
 * level (what a rating-breakdown bar chart needs). Computed on read
 * rather than denormalized onto Product — the same reasoning as
 * Product's variantCount virtual: a stored copy needs manual syncing on
 * every review create/update/delete.
 */
export const getReviewSummary = async (productId) => {
  const rows = await Review.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(String(productId)) } },
    {
      $group: {
        _id: "$rating",
        count: { $sum: 1 },
      },
    },
  ]);

  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let total = 0;
  let sum = 0;

  for (const row of rows) {
    distribution[row._id] = row.count;
    total += row.count;
    sum += row._id * row.count;
  }

  return {
    reviewCount: total,
    averageRating: total ? Number((sum / total).toFixed(2)) : null,
    distribution,
  };
};

/**
 * Admin moderation list: every review across every product, newest
 * first, searchable by comment text. Separate from getProductReviews
 * because that one is scoped to a single (visible) product and is
 * public — this one deliberately spans products, including reviews on
 * draft/archived ones, which only an admin should see.
 */
export const getAllReviews = async (req, res) => {
  const { filter, sort, skip, limit, page } = buildQueryFeatures(req.query, {
    sortableFields: ["createdAt", "rating"],
    defaultSortBy: "createdAt",
    defaultSortOrder: "desc",
  });

  // Lets an admin jump straight to the low-rated reviews, which is where
  // moderation attention usually goes.
  const rating = Number(req.query.rating);
  if (Number.isInteger(rating) && rating >= 1 && rating <= 5) {
    filter.rating = rating;
  }

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate("user", "name email")
      .populate("product", "name status"),
    Review.countDocuments(filter),
  ]);

  return res.status(200).json({
    success: true,
    data: reviews,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
};

export const createReview = async (req, res) => {
  const { productId } = req.params;
  const { rating, comment } = req.body;

  await findVisibleProduct(productId, req.user);

  // The compound unique index is the real guarantee; this check exists so
  // a repeat review gets a clear message instead of a raw duplicate-key
  // error surfacing as a generic 409.
  const existing = await Review.exists({ product: productId, user: req.user._id });
  if (existing) {
    throw new AppError("You've already reviewed this product. Edit your review instead.", 409);
  }

  const review = await Review.create({
    product: productId,
    user: req.user._id,
    rating,
    comment,
  });

  await review.populate("user", "name");

  return res.status(201).json({
    success: true,
    message: "Review posted.",
    data: review,
  });
};

export const updateReview = async (req, res) => {
  const { reviewId } = req.params;
  const { rating, comment } = req.body;

  const review = await Review.findById(reviewId);

  if (!review) {
    throw new AppError("Review not found.", 404);
  }

  // Ownership, not just role: a customer may edit only their own review.
  if (String(review.user) !== String(req.user._id)) {
    throw new AppError("You can only edit your own review.", 403);
  }

  review.rating = rating;
  review.comment = comment;
  await review.save();
  await review.populate("user", "name");

  return res.status(200).json({
    success: true,
    message: "Review updated.",
    data: review,
  });
};

export const deleteReview = async (req, res) => {
  const { reviewId } = req.params;

  const review = await Review.findById(reviewId);

  if (!review) {
    throw new AppError("Review not found.", 404);
  }

  // Two ways to be allowed: it's your review, or you're an admin removing
  // it as moderation. A full approve/reject queue is deliberately not
  // built yet — delete is the whole moderation surface for now.
  const isOwner = String(review.user) === String(req.user._id);
  const isAdmin = req.user.role === "admin";

  if (!isOwner && !isAdmin) {
    throw new AppError("You can only delete your own review.", 403);
  }

  await review.deleteOne();

  return res.status(200).json({
    success: true,
    message: "Review deleted.",
  });
};
