import cloudinary from "../config/cloudinary.js";

/**
 * Uploads a file buffer (from Multer's memoryStorage) to Cloudinary.
 *
 * Cloudinary's upload_stream expects a stream, not a raw buffer, so we
 * wrap it in a Promise and pipe the buffer into it manually. This is the
 * standard pattern for using Cloudinary with Multer's memory storage.
 *
 * @param {Buffer} fileBuffer - req.file.buffer from Multer
 * @param {string} folder - Cloudinary folder to organize uploads, e.g. "nestro/categories"
 * @returns {Promise<{url: string, publicId: string}>}
 */

export const uploadToCloudinary = (fileBuffer, folder) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      },
    );

    uploadStream.end(fileBuffer);
  });
};

/**
 * Deletes an image from Cloudinary by its public_id.
 * Used when replacing or removing an image so we don't leave orphaned
 * files sitting in Cloudinary storage forever.
 *
 * @param {string} publicId
 */
export const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return;
  await cloudinary.uploader.destroy(publicId);
};
