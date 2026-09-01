import { z } from "zod";

// Mirrors the backend's updateMeSchema (server/src/validators/auth.validator.js)
export const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters.")
    .max(50, "Name cannot exceed 50 characters."),
});
