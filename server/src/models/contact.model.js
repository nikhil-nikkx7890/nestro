import mongoose from "mongoose";

// Storage-only per ADR-041 — no email-sending integration exists yet.
// A submission just needs to be captured for an admin to read later.
const contactSubmissionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Enter a valid email address"],
    },

    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
      minlength: [10, "Message must be at least 10 characters"],
      maxlength: [2000, "Message cannot exceed 2000 characters"],
    },
  },
  {
    timestamps: true,
  },
);

const ContactSubmission = mongoose.model("ContactSubmission", contactSubmissionSchema);

export default ContactSubmission;
