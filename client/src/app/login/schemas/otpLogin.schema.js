import { z } from "zod";

// Mirrors the backend's otpLoginRequestSchema/otpLoginVerifySchema
// (server/src/validators/auth.validator.js). Two separate schemas for the
// two steps, same reason verify-reset-otp's schema only validates otp —
// each step is its own form, validated independently.
export const otpRequestSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
});

export const otpVerifySchema = z.object({
  otp: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter the 6-digit code from your email."),
});
