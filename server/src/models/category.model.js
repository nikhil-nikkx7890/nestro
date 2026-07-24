import mongoose from "mongoose";
import slugify from "../utils/slugify.js";

const categorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Category name is required"],
            trim: true,
            unique: true,
            minlength: [2, "Category name must be at least 2 characters"],
            maxlength: [50, "Category name cannot exceed 50 characters"],
        },

        slug: {
            type: String,
            unique: true,
            lowercase: true,
            index: true,
        },

        image: {
            type: String,
            default: "",
        },

        description: {
            type: String,
            trim: true,
            default: "",
        },

        isActive: {
            type: Boolean,
            default: true,
        },

        displayOrder: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

categorySchema.pre("save", function () {
    if (this.isModified("name")) {
        this.slug = slugify(this.name);
    }

});

const Category = mongoose.model("Category", categorySchema);

export default Category;