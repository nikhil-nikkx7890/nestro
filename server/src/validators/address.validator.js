import { z } from "zod";

// Raw field validators, defined once and shared between create and
// update below — NOT via addressSchema.partial(), because Zod's
// .default() still fires on an absent key even under .partial(), which
// would silently reset country/addressType/landmark/isDefault to their
// defaults on any PATCH that doesn't happen to include them. Update
// needs "omitted means don't touch", not "omitted means reset" — two
// genuinely different schemas built from the same field definitions.
const fields = {
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
  landmark: z.string().trim().max(100, "Landmark cannot exceed 100 characters."),
  // Only meaningful as an explicit request to become the default — see
  // updateAddress/createAddress in address.controller.js for why
  // isDefault: false is a no-op rather than an "unset" action.
  isDefault: z.boolean(),
};

export const addressSchema = z
  .object({
    fullName: fields.fullName,
    phone: fields.phone,
    addressLine: fields.addressLine,
    city: fields.city,
    state: fields.state,
    pincode: fields.pincode,
    country: fields.country.optional().default("India"),
    addressType: fields.addressType.optional().default("Home"),
    landmark: fields.landmark.optional().default(""),
    isDefault: fields.isDefault.optional().default(false),
  })
  .strict();

// Every field optional, no defaults — an omitted key means "leave this
// field as it is," which is what a PATCH means everywhere else in this
// app (see updateProduct, updateMaterial, etc.).
export const updateAddressSchema = z
  .object({
    fullName: fields.fullName.optional(),
    phone: fields.phone.optional(),
    addressLine: fields.addressLine.optional(),
    city: fields.city.optional(),
    state: fields.state.optional(),
    pincode: fields.pincode.optional(),
    country: fields.country.optional(),
    addressType: fields.addressType.optional(),
    landmark: fields.landmark.optional(),
    isDefault: fields.isDefault.optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required.",
  });
