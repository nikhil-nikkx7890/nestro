import { z } from "zod";
import mongoose from "mongoose";

const objectId = z
  .string()
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid ID.",
  });

export const productSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Product name must be at least 2 characters.")
      .max(150, "Product name cannot exceed 150 characters."),
    description: z.string().trim().optional().default(""),
    category: objectId,
    brand: objectId,
    roomTypes: z
      .array(objectId)
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
  })
  .strict();
