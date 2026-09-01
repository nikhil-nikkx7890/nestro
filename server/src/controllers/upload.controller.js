import { uploadToCloudinary } from "../utils/cloudinary.js";
import AppError from "../utils/AppError.js";

// Whitelisted rather than accepting any caller-supplied string — keeps
// every upload inside the app's own known folder structure instead of an
// arbitrary attacker(admin)-controlled path in the Cloudinary account.
const ALLOWED_FOLDERS = new Set([
  "nestro/categories",
  "nestro/room-types",
  "nestro/brands",
  "nestro/materials",
  "nestro/products",
  "nestro/variants",
  "nestro/misc",
]);

/**
 * Handles a single image upload. Not tied to any specific module —
 * Category, Brand, or anything else that needs an image calls this
 * same endpoint and gets back { url, publicId } to store as a reference.
 */
export const uploadImage = async (req, res) => {
  if (!req.file) {
    throw new AppError("No image file was provided.", 400);
  }

  const folder = ALLOWED_FOLDERS.has(req.body.folder) ? req.body.folder : "nestro/misc";

  // Left uncaught deliberately — the centralized errorHandler already
  // logs it server-side and returns a generic message to the client,
  // rather than this controller echoing the raw Cloudinary error back.
  const { url, publicId } = await uploadToCloudinary(req.file.buffer, folder);

  return res.status(201).json({
    success: true,
    message: "Image uploaded successfully.",
    data: { url, publicId },
  });
};
