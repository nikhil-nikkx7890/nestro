import slugify from "./slugify.js";

/**
 * Generates a slug for `name`, appending a numeric suffix if it collides
 * with another document's slug on the same Model.
 *
 * @param {import("mongoose").Model} Model
 * @param {string} name
 * @param {import("mongoose").Types.ObjectId} [excludeId] - current doc's _id, so it doesn't collide with itself on update
 * @returns {Promise<string>}
 */
export const generateUniqueSlug = async (Model, name, excludeId) => {
  const baseSlug = slugify(name);
  let slug = baseSlug;
  let counter = 2;

  while (
    await Model.exists({
      slug,
      ...(excludeId && { _id: { $ne: excludeId } }),
    })
  ) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
};
