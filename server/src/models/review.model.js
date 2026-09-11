import mongoose from "mongoose";

/**
 * A real review written by a real account, not a rating baked into the
 * Product document. That distinction is the whole point (see the ADR that
 * refines ADR-041): the star ratings shown on the storefront are computed
 * from these documents, so seeding demo reviews is the same kind of demo
 * data as the seeded catalog — not an invented number typed into JSX.
 *
 * Verified-purchase gated as of ADR-068: review.controller.js's
 * createReview requires at least one Delivered order containing the
 * product before a review can be created at all, and isVerifiedPurchase
 * records that a given review passed that gate. The 177 reviews seeded
 * under ADR-054 predate Orders existing as a concept — they were never
 * re-run against this rule and never will be; `default: false` is what
 * they show, honestly, without a migration pretending otherwise.
 */
const reviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product reference is required"],
      index: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
    },

    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },

    comment: {
      type: String,
      required: [true, "Comment is required"],
      trim: true,
      minlength: [10, "Comment must be at least 10 characters"],
      maxlength: [1000, "Comment cannot exceed 1000 characters"],
    },

    // Server-set only (ADR-068) — never accepted from the client, the
    // same way Order's snapshot fields aren't either. `default: false`
    // is what every review created before this field existed reads as,
    // with no migration needed to make that true.
    isVerifiedPurchase: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// One review per customer per product — the same "compound uniqueness"
// approach ProductVariant already uses for product+material+color.
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

// Lets the admin moderation list search review text (finding spam or a
// reported phrase). buildQueryFeatures' `search` param is a $text query,
// so without this index it would match nothing at all.
reviewSchema.index({ comment: "text" });

const Review = mongoose.model("Review", reviewSchema);

export default Review;
