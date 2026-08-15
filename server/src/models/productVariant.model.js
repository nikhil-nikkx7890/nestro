import mongoose from "mongoose";

const productVariantSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product reference is required"],
    },

    sku: {
      type: String,
      required: [true, "SKU is required"],
      unique: true,
      trim: true,
      uppercase: true,
    },

    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },

    compareAtPrice: {
      type: Number,
      min: [0, "Compare-at price cannot be negative"],
      default: null,
      validate: {
        validator: function (value) {
          if (value === null || value === undefined) return true;
          return value > this.price;
        },
        message: "Compare-at price must be greater than the price",
      },
    },

    material: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Material",
      required: [true, "Material is required"],
    },

    color: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Color",
      required: [true, "Color is required"],
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

    stock: {
      type: Number,
      required: true,
      min: [0, "Stock cannot be negative"],
      default: 0,
    },

    lowStockThreshold: {
      type: Number,
      min: [0, "Low stock threshold cannot be negative"],
      default: 5,
    },

    dimensions: {
      length: { type: Number, min: 0 },
      width: { type: Number, min: 0 },
      height: { type: Number, min: 0 },
      unit: { type: String, enum: ["cm", "in"], default: "cm" },
    },

    weight: {
      value: { type: Number, min: 0 },
      unit: { type: String, enum: ["kg", "lb"], default: "kg" },
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

productVariantSchema.index(
  { product: 1, material: 1, color: 1 },
  { unique: true },
);

const ProductVariant = mongoose.model("ProductVariant", productVariantSchema);

export default ProductVariant;
