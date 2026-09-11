import { z } from "zod";

// Mirrors the backend's resetPasswordSchema, plus a client-only
// confirmPassword field — the backend never sees it, it just catches a
// typo before the request goes out (this page has no "type it again
// later at login" safety net the way register does, since a wrong
// password here means going through the whole OTP flow again).
export const resetPasswordSchema = z
  .object({
    newPassword: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(1, "Please confirm your password."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });
