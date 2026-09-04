import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import { buildDimensions, buildWeight, buildSpecifications } from "../utils/catalogDetails.js";

import Product from "../models/product.model.js";
import ProductVariant from "../models/productVariant.model.js";
import "../models/category.model.js"; // registers the Category schema for the populate() calls below

// A plain `.replace(/s$/, "")` mis-singularizes a couple of category
// names ("Bookshelves" -> "Bookshelve", "Garden Benches" -> "Garden
// Benche") — these two need an explicit override, everything else
// pluralizes with a trailing "s" and the regex fallback is correct.
const SINGULAR_OVERRIDES = {
  Bookshelves: "Bookshelf",
  "Garden Benches": "Garden Bench",
};

/**
 * One-time backfill for Products/Variants seeded by an earlier version of
 * seedCatalog.js, before it generated specifications/dimensions/weight.
 * Only touches documents missing the field — safe to re-run, and never
 * re-uploads images (that's the expensive, rate-limited part), just adds
 * the text/number fields seedCatalog.js now generates for new documents.
 */
const backfill = async () => {
  await connectDB();

  const products = await Product.find({
    $or: [{ specifications: { $size: 0 } }, { specifications: { $exists: false } }],
  }).populate("category", "name");

  console.log(`Products missing specifications: ${products.length}`);
  for (const product of products) {
    if (!product.category?.name) continue;
    const singular =
      SINGULAR_OVERRIDES[product.category.name] || product.category.name.replace(/s$/, "");
    product.specifications = buildSpecifications(singular);
    await product.save();
  }
  console.log(`Backfilled specifications on ${products.length} products.`);

  const variants = await ProductVariant.find({
    $or: [{ dimensions: { $exists: false } }, { "dimensions.length": { $exists: false } }],
  }).populate({ path: "product", populate: { path: "category", select: "name" } });

  console.log(`Variants missing dimensions: ${variants.length}`);
  let updated = 0;
  for (const variant of variants) {
    const categoryName = variant.product?.category?.name;
    if (!categoryName) continue;
    variant.dimensions = buildDimensions(categoryName);
    variant.weight = buildWeight(categoryName);
    await variant.save();
    updated++;
  }
  console.log(`Backfilled dimensions/weight on ${updated} variants.`);

  await mongoose.disconnect();
  process.exit(0);
};

backfill().catch((error) => {
  console.error("Backfill failed:", error);
  process.exit(1);
});
