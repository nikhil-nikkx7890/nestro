import mongoose from "mongoose";
import slugify from "../utils/slugify.js";

const roomTypeSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Room type name is required"],
            unique: true,
            trim: true,
            lowercase: true,
            minlength: [2, "Room type name must be at least 2 characters"],
            maxlength: [50, "Room type name cannot exceed 50 characters"]
        },
        slug: {
            type: String,
            unique: true,
            lowercase: true,
            index: true,
        },
        isActive: {
            type: Boolean,
            default: true
        }
    }, {
        timestamps: true,
    }
);
roomTypeSchema.pre("save", function () {
    if (this.isModified("name")) {
        this.slug = slugify(this.name);
    }
});

const RoomType = mongoose.model("RoomType", roomTypeSchema);

export default RoomType;