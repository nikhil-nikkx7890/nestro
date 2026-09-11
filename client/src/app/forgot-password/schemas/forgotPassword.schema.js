import { z } from "zod";

// Mirrors the backend's forgotPasswordSchema (server/src/validators/auth.validator.js)
export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
});
