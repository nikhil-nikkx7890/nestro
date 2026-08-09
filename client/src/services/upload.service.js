import api from "@/lib/axios";

/**
 * Uploads a single image file to the shared backend upload endpoint.
 * Not tied to Category — any module's form can call this the same way.
 *
 * @param {File} file - the raw File object from an <input type="file">
 * @param {string} folder - Cloudinary folder, e.g. "nestro/categories"
 * @returns {Promise<{url: string, publicId: string}>}
 */
export const uploadImage = async (file, folder) => {
  const formData = new FormData();
  formData.append("image", file);
  formData.append("folder", folder);

  const response = await api.post("/upload/image", formData, {
    headers: {
      // Explicitly clear the axios instance's default JSON header.
      // We do NOT hardcode "multipart/form-data" ourselves — the
      // browser must generate it, because it includes a unique
      // "boundary" value the server needs to parse the parts.
      // Setting it to undefined tells axios "don't send this
      // default header," letting the browser fill in the real one.
      "Content-Type": undefined,
    },
  });

  return response.data.data; // { url, publicId }
};
