import mongoose from "mongoose";

/**
 * One order line — a snapshot of what was actually bought, not a live
 * reference (ADR-026, closed by ADR-066). `variant`/`product` are kept
 * for traceability (e.g. a future "verified purchase" review gate,
 * ADR-054's own open item), but nothing here is ever re-read from the
 * current Product/ProductVariant documents — editing a price or deleting
 * a product after the fact must never rewrite a past order.
 */
const orderItemSchema = new mongoose.Schema(
  {
    variant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductVariant",
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: { type: String, required: true },
    sku: { type: String, required: true },
    image: { type: String, default: "" },
    material: { type: String, default: "" },
    color: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 }, // minor units (paise), same convention as ProductVariant.price
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

/**
 * Shipping address — copied from the selected Address document at
 * checkout time (ADR-066), not a live reference, for the same reason
 * the line items above are snapshotted: a customer editing or deleting
 * a saved address later must never change where a past order says it
 * shipped. Deliberately omits `_id`/`user`/`isDefault` — those are
 * Address-management concerns, meaningless on a frozen copy.
 */
const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    addressLine: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, required: true },
    addressType: { type: String, enum: ["Home", "Office", "Other"] },
    landmark: { type: String, default: "" },
  },
  { _id: false },
);

// Six delivery stages plus two side-branches reachable from earlier
// points rather than positions within the sequence (ADR-066) — see
// order.controller.js's isValidStatusTransition for the state machine
// this enum only declares the vocabulary for.
const ORDER_STATUSES = [
  "Pending",
  "Confirmed",
  "Processing",
  "Shipped",
  "OutForDelivery",
  "Delivered",
  "Cancelled",
  "Returned",
];

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (items) => items.length > 0,
        message: "An order must have at least one item.",
      },
    },

    shippingAddress: {
      type: shippingAddressSchema,
      required: true,
    },

    // COD-only for now (ADR-066) — the field exists (rather than being
    // omitted until Payments) specifically so Payments extends this enum
    // instead of introducing the field from scratch.
    paymentMethod: {
      type: String,
      enum: ["COD"],
      default: "COD",
      required: true,
    },

    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: "Pending",
      index: true,
    },

    // subtotal + shippingFee = total. shippingFee is flat 0 (free
    // shipping) for this phase — a real shipping-cost rule (weight/
    // distance/threshold-based) is out of scope here and wasn't asked
    // for; kept as its own field rather than folded into subtotal so a
    // future real value is a data change, not a schema change.
    subtotal: { type: Number, required: true, min: 0 },
    shippingFee: { type: Number, required: true, min: 0, default: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  {
    timestamps: true,
  },
);

// Powers "my orders, newest first" (customer) and "all orders, optionally
// by status" (admin) without a full collection scan as order volume grows.
orderSchema.index({ user: 1, createdAt: -1 });

export const ORDER_STATUS_VALUES = ORDER_STATUSES;

const Order = mongoose.model("Order", orderSchema);

export default Order;
