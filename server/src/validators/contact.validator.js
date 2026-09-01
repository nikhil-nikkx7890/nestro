import { z } from "zod";

export const contactSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters.")
      .max(50, "Name cannot exceed 50 characters."),
    email: z.string().trim().toLowerCase().email("Enter a valid email address."),
    message: z
      .string()
      .trim()
      .min(10, "Message must be at least 10 characters.")
      .max(2000, "Message cannot exceed 2000 characters."),
  })
  .strict();
