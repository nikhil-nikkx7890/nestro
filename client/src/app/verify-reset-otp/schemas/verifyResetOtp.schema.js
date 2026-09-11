import { z } from "zod";

// Mirrors the backend's verifyResetOtpSchema (server/src/validators/auth.validator.js).
// email isn't a form field here — it's carried in from the previous step
// via sessionStorage (see page.jsx) and sent alongside the OTP as-is.
export const verifyResetOtpSchema = z.object({
  otp: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter the 6-digit code from your email."),
});
