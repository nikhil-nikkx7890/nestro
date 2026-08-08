import { z } from "zod";

export const categorySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Category name must be at least 2 characters.")
      .max(50, "Category name cannot exceed 50 characters.")
      .regex(
        /^[A-Za-z0-9\s&()'/-]+$/,
        "Category name contains invalid characters.",
      ),
    description: z
      .string()
      .trim()
      .max(500, "Category description cannot exceed 500 characters.")
      .optional()
      .default(""),
    isActive: z.boolean(),
  })
  .strict();
