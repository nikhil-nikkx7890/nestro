import mongoose from "mongoose";
import slugify from "../utils/slugify.js";

const materialSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Material Name is required"],
      unique: true,
      trim: true,
      minlength: [2, "Material name must be at least 2 characters"],
      maxlength: [50, "Material name cannot exceed 50 characters"],
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
  { timestamps: true },
);

materialSchema.pre("save", function () {
  if (this.isModified("name")) {
    this.slug = slugify(this.name);
  }
});

const Material = mongoose.model("Material", materialSchema);
export default Material;
