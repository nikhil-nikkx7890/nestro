import mongoose from "mongoose";
import { generateUniqueSlug } from "../utils/generateUniqueSlug.js";

const roomTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Room type name is required"],
      unique: true,
      trim: true,
      minlength: [2, "Room type name must be at least 2 characters"],
      maxlength: [50, "Room type name cannot exceed 50 characters"],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true,
    },
    image: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);
roomTypeSchema.pre("save", async function () {
  if (this.isModified("name")) {
    this.slug = await generateUniqueSlug(this.constructor, this.name, this._id);
  }
});

const RoomType = mongoose.model("RoomType", roomTypeSchema);

export default RoomType;
