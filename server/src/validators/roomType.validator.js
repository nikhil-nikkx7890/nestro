import { z } from "zod";

export const roomTypeSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Room type name must be at least 2 characters.")
      .max(50, "Room type name cannot exceed 50 characters.")
      .regex(
        /^[A-Za-z0-9\s&()'/-]+$/,
        "Room type name contains invalid characters.",
      ),
    isActive: z.boolean(),
  })
  .strict();
