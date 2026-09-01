import mongoose from "mongoose";
import { generateUniqueSlug } from "../utils/generateUniqueSlug.js";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      unique: true,
      minlength: [2, "Category name must be at least 2 characters"],
      maxlength: [50, "Category name cannot exceed 50 characters"],
    },

    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true,
    },

    image: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    displayOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

categorySchema.pre("save", async function () {
  if (this.isModified("name")) {
    this.slug = await generateUniqueSlug(this.constructor, this.name, this._id);
  }
});

categorySchema.index({ name: "text" });

// Virtual — same pattern as Product's variantCount. Counts every Product
// referencing this Category regardless of status, so the same number is
// reusable for both the admin list row and the storefront homepage
// (see ADR-041).
categorySchema.virtual("productCount", {
  ref: "Product",
  localField: "_id",
  foreignField: "category",
  count: true,
});

categorySchema.set("toJSON", { virtuals: true });
categorySchema.set("toObject", { virtuals: true });

const Category = mongoose.model("Category", categorySchema);

export default Category;
