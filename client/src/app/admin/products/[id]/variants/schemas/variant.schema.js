import { z } from "zod";

const dimensionsSchema = z
  .object({
    length: z.coerce.number().min(0).optional(),
    width: z.coerce.number().min(0).optional(),
    height: z.coerce.number().min(0).optional(),
    unit: z.enum(["cm", "in"]).optional().default("cm"),
  })
  .optional();

const weightSchema = z
  .object({
    value: z.coerce.number().min(0).optional(),
    unit: z.enum(["kg", "lb"]).optional().default("kg"),
  })
  .optional();

export const variantSchema = z
  .object({
    price: z.coerce.number().int("Price must be a whole number.").min(0),
    compareAtPrice: z
      .string()
      .or(z.number())
      .optional()
      .transform((val) => {
        if (val === "" || val === undefined || val === null) return null;
        return typeof val === "string" ? Number(val) : val;
      })
      .refine((val) => val === null || Number.isInteger(val), {
        message: "Compare-at price must be a whole number.",
      })
      .refine((val) => val === null || val >= 0, {
        message: "Compare-at price cannot be negative.",
      }),
    material: z.string().trim().min(1, "Material is required."),
    color: z.string().trim().min(1, "Color is required."),
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
    stock: z.coerce.number().int().min(0).optional().default(0),
    lowStockThreshold: z.coerce.number().int().min(0).optional().default(5),
    dimensions: dimensionsSchema,
    weight: weightSchema,
    isActive: z.boolean().optional().default(true),
  })
  .refine(
    (data) =>
      data.compareAtPrice === null ||
      data.compareAtPrice === undefined ||
      data.compareAtPrice > data.price,
    {
      message: "Compare-at price must be greater than the price.",
      path: ["compareAtPrice"],
    },
  );
