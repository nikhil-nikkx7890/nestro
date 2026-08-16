import { z } from "zod";
import mongoose from "mongoose";

const objectId = z
  .string()
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid ID.",
  });

const dimensionsSchema = z
  .object({
    length: z.number().min(0).optional(),
    width: z.number().min(0).optional(),
    height: z.number().min(0).optional(),
    unit: z.enum(["cm", "in"]).optional().default("cm"),
  })
  .optional();

const weightSchema = z
  .object({
    value: z.number().min(0).optional(),
    unit: z.enum(["kg", "lb"]).optional().default("kg"),
  })
  .optional();

export const productVariantSchema = z
  .object({
    price: z.number().int("Price must be an integer (minor units).").min(0),
    compareAtPrice: z
      .number()
      .int("Compare-at price must be an integer (minor units).")
      .min(0)
      .nullable()
      .optional()
      .default(null),
    material: objectId,
    color: objectId,
    images: z
      .array(
        z.object({
          url: z.string().trim().optional().default(""),
          publicId: z.string().trim().optional().default(""),
        }),
      )
      .max(4, "You can add up to 4 images.")
      .optional()
      .default([]),
    stock: z.number().int().min(0).optional().default(0),
    lowStockThreshold: z.number().int().min(0).optional().default(5),
    dimensions: dimensionsSchema,
    weight: weightSchema,
    isActive: z.boolean().optional().default(true),
  })
  .strict()
  .refine(
    (data) => data.compareAtPrice === null || data.compareAtPrice > data.price,
    {
      message: "Compare-at price must be greater than the price.",
      path: ["compareAtPrice"],
    },
  );
