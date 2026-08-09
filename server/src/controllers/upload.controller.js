import { uploadToCloudinary } from "../utils/cloudinary.js";

/**
 * Handles a single image upload. Not tied to any specific module —
 * Category, Brand, or anything else that needs an image calls this
 * same endpoint and gets back { url, publicId } to store as a reference.
 */
export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file was provided.",
      });
    }

    const folder = req.body.folder || "nestro/misc";

    const { url, publicId } = await uploadToCloudinary(req.file.buffer, folder);

    return res.status(201).json({
      success: true,
      message: "Image uploaded successfully.",
      data: { url, publicId },
    });
  } catch (error) {
    console.error("Image upload error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to upload image.",
      error: error.message,
    });
  }
};
