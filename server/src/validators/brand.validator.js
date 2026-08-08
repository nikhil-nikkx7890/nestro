import { z } from "zod";

export const brandSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Brand name must be at least 2 characters.")
      .max(50, "Brand name cannot exceed 50 characters.")
      .regex(
        /^[A-Za-z0-9\s&()'/-]+$/,
        "Brand name contains invalid characters.",
      ),
    isActive: z.boolean(),
  })
  .strict();
