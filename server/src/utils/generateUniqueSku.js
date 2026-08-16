import slugify from "./slugify.js";

const abbreviate = (text, maxLen = 10) =>
  slugify(text).replace(/-/g, "").slice(0, maxLen).toUpperCase();

/**
 * Last 4 chars of a Mongo ObjectId, uppercased — a short, cheap way to
 * disambiguate two names that happen to abbreviate the same way (e.g.
 * "Sheesham Wood" and "Sheesham Frame" both truncate to "SHEESHAM").
 * ObjectIds are already unique per document, so this reuses that
 * uniqueness instead of hoping truncated text stays distinct.
 */
const idSuffix = (id) => id.toString().slice(-4).toUpperCase();

/**
 * Builds a unique SKU from a product, material, and color document, e.g.
 * "Sofa Set" + "Sheesham Wood" + "Black" -> "SOFASET-SHEESHAM7A2F-BLACK9B1C".
 * Material and color segments include an id suffix because names are
 * truncated for readability and truncation alone can't guarantee two
 * different materials/colors never produce the same abbreviation.
 * Falls back to a numeric suffix on the rare full-string collision,
 * same pattern as generateUniqueSlug.
 *
 * @param {import("mongoose").Model} Model - ProductVariant
 * @param {{ product: {_id, name}, material: {_id, name}, color: {_id, name} }} docs
 * @param {import("mongoose").Types.ObjectId} [excludeId] - current doc's _id, so it doesn't collide with itself on update
 * @returns {Promise<string>}
 */
export const generateUniqueSku = async (
  Model,
  { product, material, color },
  excludeId,
) => {
  const baseSku = [
    abbreviate(product.name),
    `${abbreviate(material.name, 8)}${idSuffix(material._id)}`,
    `${abbreviate(color.name, 8)}${idSuffix(color._id)}`,
  ]
    .filter(Boolean)
    .join("-");

  let sku = baseSku;
  let counter = 2;

  while (
    await Model.exists({
      sku,
      ...(excludeId && { _id: { $ne: excludeId } }),
    })
  ) {
    sku = `${baseSku}-${counter}`;
    counter++;
  }

  return sku;
};
