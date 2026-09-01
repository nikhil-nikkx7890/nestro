import { z } from "zod";

// Mirrors the backend's contactSchema (server/src/validators/contact.validator.js)
export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters.")
    .max(50, "Name cannot exceed 50 characters."),
  email: z.string().trim().email("Enter a valid email address."),
  message: z
    .string()
    .trim()
    .min(10, "Message must be at least 10 characters.")
    .max(2000, "Message cannot exceed 2000 characters."),
});
