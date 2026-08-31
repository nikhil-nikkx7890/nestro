import { z } from "zod";
import mongoose from "mongoose";

const objectId = z
  .string()
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid ID.",
  });

export const addCartItemSchema = z
  .object({
    variant: objectId,
    quantity: z.number().int("Quantity must be a whole number.").min(1).optional().default(1),
  })
  .strict();

export const updateCartItemSchema = z
  .object({
    quantity: z.number().int("Quantity must be a whole number.").min(1),
  })
  .strict();
