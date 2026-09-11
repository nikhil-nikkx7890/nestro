import { z } from "zod";
import mongoose from "mongoose";
import { ORDER_STATUS_VALUES } from "../models/order.model.js";

const objectId = z
  .string()
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid ID.",
  });

export const checkoutSchema = z
  .object({
    addressId: objectId,
  })
  .strict();

export const updateOrderStatusSchema = z
  .object({
    status: z.enum(ORDER_STATUS_VALUES, { message: "Invalid status." }),
  })
  .strict();
