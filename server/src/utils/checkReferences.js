import AppError from "./AppError.js";

/**
 * Blocks deletion of a Master Data record if it's still referenced by
 * Product or ProductVariant. Throws a 409 AppError if referenced.
 *
 * @param {import("mongoose").Model} Model - Product or ProductVariant
 * @param {string} field - field name to match against (e.g. "category", "material")
 * @param {import("mongoose").Types.ObjectId} value - the _id being deleted
 * @param {string} entityLabel - human-readable label for the error message (e.g. "product")
 */
export const assertNotReferenced = async (Model, field, value, entityLabel) => {
  const count = await Model.countDocuments({ [field]: value });

  if (count > 0) {
    throw new AppError(
      `Cannot delete — ${count} ${entityLabel}${count > 1 ? "s" : ""} still reference this record.`,
      409,
    );
  }
};
