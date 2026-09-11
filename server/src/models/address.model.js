import mongoose from "mongoose";

/**
 * A user's saved shipping address — a flat, top-level collection (one
 * document per address, not one document-with-array per user the way
 * Cart/Wishlist are), because each address needs its own _id for
 * individual PATCH/DELETE and there's no cap on how many a user may
 * have (ADR-065).
 *
 * Deliberately does NOT snapshot into an Order at this point — that's
 * out of scope for this phase (address CRUD only) and will need its own
 * decision when Orders is designed, the same "snapshot, don't reference"
 * question already open for order line items (STATUS section 10, P2).
 */
const addressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      minlength: [2, "Full name must be at least 2 characters"],
      maxlength: [100, "Full name cannot exceed 100 characters"],
    },

    // 10-digit Indian mobile number (TRAI numbering plan: starts 6-9),
    // not a generic phone field — the same "match the real context, not
    // a lowest-common-denominator format" reasoning ADR-065 already
    // applies to Address Type and Landmark.
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      match: [/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"],
    },

    addressLine: {
      type: String,
      required: [true, "Address line is required"],
      trim: true,
      minlength: [5, "Address line must be at least 5 characters"],
      maxlength: [200, "Address line cannot exceed 200 characters"],
    },

    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
      maxlength: [50, "City cannot exceed 50 characters"],
    },

    state: {
      type: String,
      required: [true, "State is required"],
      trim: true,
      maxlength: [50, "State cannot exceed 50 characters"],
    },

    // 6-digit Indian PIN code (India Post format). String, not Number —
    // never used arithmetically, and a leading zero is a real PIN code.
    pincode: {
      type: String,
      required: [true, "Pincode is required"],
      trim: true,
      match: [/^\d{6}$/, "Enter a valid 6-digit pincode"],
    },

    country: {
      type: String,
      required: [true, "Country is required"],
      trim: true,
      default: "India",
      maxlength: [56, "Country cannot exceed 56 characters"],
    },

    addressType: {
      type: String,
      enum: ["Home", "Office", "Other"],
      default: "Home",
    },

    // Optional — helps courier delivery in addresses that don't resolve
    // precisely from pincode + line alone (ADR-065).
    landmark: {
      type: String,
      trim: true,
      maxlength: [100, "Landmark cannot exceed 100 characters"],
      default: "",
    },

    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// Every list read is scoped to one user, sorted default-first — this
// covers both without a compound-sort index doing a full collection scan
// as address counts grow.
addressSchema.index({ user: 1, isDefault: -1, createdAt: -1 });

const Address = mongoose.model("Address", addressSchema);

export default Address;
