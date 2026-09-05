import mongoose from "mongoose";

/**
 * A real review written by a real account, not a rating baked into the
 * Product document. That distinction is the whole point (see the ADR that
 * refines ADR-041): the star ratings shown on the storefront are computed
 * from these documents, so seeding demo reviews is the same kind of demo
 * data as the seeded catalog — not an invented number typed into JSX.
 *
 * Deliberately NOT verified-purchase-gated: Orders don't exist yet
 * (Commerce is unbuilt), so requiring a purchase would make the feature
 * unreachable. When Orders land, this is where that check belongs.
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
