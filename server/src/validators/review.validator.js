import { z } from "zod";

export const reviewSchema = z
  .object({
    rating: z
      .number({ message: "Rating is required." })
      .int("Rating must be a whole number.")
      .min(1, "Rating must be at least 1.")
      .max(5, "Rating cannot exceed 5."),
    comment: z
      .string()
      .trim()
      .min(10, "Comment must be at least 10 characters.")
      .max(1000, "Comment cannot exceed 1000 characters."),
  })
  .strict();
