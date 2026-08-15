import mongoose from "mongoose";
import { generateUniqueSlug } from "../utils/generateUniqueSlug.js";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      minlength: [2, "Product name must be at least 2 characters"],
      maxlength: [150, "Product name cannot exceed 150 characters"],
    },

    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },

    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: [true, "Brand is required"],
    },

    roomTypes: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "RoomType" }],
      validate: {
        validator: (val) => val.length > 0,
        message: "At least one room type is required",
      },
    },

    images: {
      type: [
        {
          url: { type: String, default: "" },
          publicId: { type: String, default: "" },
        },
      ],
      default: [],
    },

    specifications: {
      type: [
        {
          key: { type: String, trim: true, required: true },
          value: { type: String, trim: true, required: true },
        },
      ],
      default: [],
    },

    seo: {
      title: { type: String, trim: true, default: "" },
      description: { type: String, trim: true, default: "" },
    },

    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
  },
  {
    timestamps: true,
  },
);

productSchema.pre("save", async function () {
  if (this.isModified("name")) {
    this.slug = await generateUniqueSlug(this.constructor, this.name, this._id);
  }
});

productSchema.index({ name: "text" });

const Product = mongoose.model("Product", productSchema);

export default Product;
