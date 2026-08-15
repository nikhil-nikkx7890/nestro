import mongoose from "mongoose";
import { generateUniqueSlug } from "../utils/generateUniqueSlug.js";

const colorSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Color name is required"],
            unique: true,
            trim: true,
            minlength: [2, "Color name must be at least 2 characters"],
            maxlength: [50, "Color name cannot exceed 50 characters"],
        },

        hexCode: {
            type: String,
            required: [true, "Color hex code is required"],
            trim: true,
            uppercase: true,
            match: [/^#[0-9A-F]{6}$/, "Hex code must be a valid 6-digit hex value, e.g. #8B5E3C"],
        },

        slug: {
            type: String,
            unique: true,
            lowercase: true,
            index: true,
        },

        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

colorSchema.pre("save", async function () {
    if (this.isModified("name")) {
        this.slug = await generateUniqueSlug(this.constructor, this.name, this._id);
    }
});

colorSchema.index({ name: "text" });

const Color = mongoose.model("Color", colorSchema);

export default Color;