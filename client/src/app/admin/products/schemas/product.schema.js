import { z } from "zod";

export const productSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Product name must be at least 2 characters.")
    .max(150, "Product name cannot exceed 150 characters."),

  description: z.string().trim().optional().default(""),

  category: z.string().trim().min(1, "Category is required."),
  brand: z.string().trim().min(1, "Brand is required."),

  roomTypes: z
    .array(z.string())
    .min(1, "At least one room type is required."),

  images: z
    .array(
      z.object({
        url: z.string().trim().optional().default(""),
        publicId: z.string().trim().optional().default(""),
      }),
    )
    .optional()
    .default([]),

  specifications: z
    .array(
      z.object({
        key: z.string().trim().min(1, "Specification key is required."),
        value: z.string().trim().min(1, "Specification value is required."),
      }),
    )
    .optional()
    .default([]),

  seo: z
    .object({
      title: z.string().trim().optional().default(""),
      description: z.string().trim().optional().default(""),
    })
    .optional()
    .default({ title: "", description: "" }),

  status: z.enum(["draft", "published", "archived"]).optional().default("draft"),
});
