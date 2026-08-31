import { z } from "zod";
import mongoose from "mongoose";

const objectId = z
  .string()
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid ID.",
  });

export const addWishlistItemSchema = z
  .object({
    product: objectId,
  })
  .strict();
