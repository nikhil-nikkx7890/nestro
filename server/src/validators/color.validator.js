import { z } from "zod";

export const colorSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Color name must be at least 2 characters.")
      .max(50, "Color name cannot exceed 50 characters.")
      .regex(
        /^[A-Za-z0-9\s&()'/-]+$/,
        "Color name contains invalid characters.",
      ),
    hexCode: z
      .string()
      .trim()
      .regex(/^#[0-9A-Fa-f]{6}$/, "Enter a valid hex code, e.g. #8B5E3C")
      .transform((val) => val.toUpperCase()),
    isActive: z.boolean(),
  })
  .strict();
