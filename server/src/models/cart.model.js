import mongoose from "mongoose";

// A Cart item stores only a live reference, never a price/name snapshot —
// the opposite of ADR-026's Order line snapshot, deliberately. An Order
// must never change after purchase; a Cart is pre-purchase and mutable, so
// it should always reflect the variant's *current* price and stock. Every
// read (cart.controller.js getCart) populates variant/product live.
const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    items: {
      type: [
        {
          variant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ProductVariant",
            required: true,
          },
          quantity: {
            type: Number,
            required: true,
            min: [1, "Quantity must be at least 1"],
          },
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

const Cart = mongoose.model("Cart", cartSchema);

export default Cart;
