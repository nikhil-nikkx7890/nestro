import { z } from "zod";

// Mirrors the backend's addressSchema (server/src/validators/address.validator.js).
// One schema for both add and edit — the form always submits every
// field (a full replace from the form's own perspective), even though
// the PATCH endpoint itself supports a genuine partial update; the
// backend's separate updateAddressSchema exists for callers that send a
// true partial body (this form never does), like the "set as default"
// action's own direct { isDefault: true } patch.
export const addressSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters.")
    .max(100, "Full name cannot exceed 100 characters."),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number."),
  addressLine: z
    .string()
    .trim()
    .min(5, "Address line must be at least 5 characters.")
    .max(200, "Address line cannot exceed 200 characters."),
  city: z.string().trim().min(1, "City is required.").max(50, "City cannot exceed 50 characters."),
  state: z
    .string()
    .trim()
    .min(1, "State is required.")
    .max(50, "State cannot exceed 50 characters."),
  pincode: z.string().trim().regex(/^\d{6}$/, "Enter a valid 6-digit pincode."),
  country: z
    .string()
    .trim()
    .min(1, "Country is required.")
    .max(56, "Country cannot exceed 56 characters."),
  addressType: z.enum(["Home", "Office", "Other"]),
  landmark: z.string().trim().max(100, "Landmark cannot exceed 100 characters.").optional(),
});
