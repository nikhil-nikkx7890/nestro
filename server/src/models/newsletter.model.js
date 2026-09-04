import mongoose from "mongoose";

// Storage-only, same shape and reasoning as contact.model.js — no email
// provider integration exists yet, a subscription just needs to be
// captured. Email is unique so re-subscribing can be treated as a no-op
// rather than piling up duplicate rows.
const newsletterSubscriberSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Enter a valid email address"],
    },
  },
  {
    timestamps: true,
  },
);

const NewsletterSubscriber = mongoose.model(
  "NewsletterSubscriber",
  newsletterSubscriberSchema,
);

export default NewsletterSubscriber;
