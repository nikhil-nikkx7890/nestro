import mongoose from "mongoose";
import slugify from "../utils/slugify.js";

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

colorSchema.pre("save", function () {
    if (this.isModified("name")) {
        this.slug = slugify(this.name);
    }
});

const Color = mongoose.model("Color", colorSchema);

export default Color;