import { z } from "zod";

export const materialSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Material name must be at least 2 characters.")
    .max(50, "Material name cannot exceed 50 characters.")
    .regex(
      /^[A-Za-z0-9\s&()'/-]+$/,
      "Material name contains invalid characters.",
    ),
  image: z.object({
    url: z.string().trim().optional().default(""),
    publicId: z.string().trim().optional().default(""),
  }),
  isActive: z.boolean(),
});
