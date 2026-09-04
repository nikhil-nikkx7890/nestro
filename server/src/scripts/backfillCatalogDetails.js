import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import cloudinary from "../config/cloudinary.js";
import { searchUnsplashPhotos } from "../utils/unsplash.js";
import {
  buildDimensions,
  buildWeight,
  buildSpecifications,
  buildDescription,
} from "../utils/catalogDetails.js";

import Product from "../models/product.model.js";
import ProductVariant from "../models/productVariant.model.js";
import "../models/category.model.js"; // registers the Category schema for the populate() calls below
import "../models/roomType.model.js"; // same, for the roomTypes populate in the description step

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

  // --- Descriptions -------------------------------------------------
  // The first seed run wrote one flat sentence for every product ("A
  // vintage garden bench, part of Nestro's Garden Benches collection."),
  // which reads as filler on a product page. Matches only that exact
  // shape, so a hand-written description is never overwritten.
  // Two shapes are matched: the original flat sentence, and any sentence
  // this script itself generated (so a later fix to the templates — like
  // the a/an article handling — can be re-applied). A hand-written
  // description matches neither and is left alone.
  const generatedDescription = new RegExp(
    [
      "^A .+, part of Nestro's .+ collection\\.$",
      "^An? .+ built for the .+, made to hold up to daily use for years\\.$",
      "^This .+ brings a considered, .+ edge to any .+\\.$",
      "^An? .+ with an? .+ silhouette — simple lines, honest materials, nothing extra\\.$",
      "^Designed for the .+, this .+ pairs an? .+ look with everyday durability\\.$",
    ].join("|"),
  );
  const describable = await Product.find({ description: generatedDescription })
    .populate("category", "name")
    .populate("roomTypes", "name");

  console.log(`Products with the old generic description: ${describable.length}`);
  let described = 0;
  for (const product of describable) {
    if (!product.category?.name) continue;
    const singular =
      SINGULAR_OVERRIDES[product.category.name] || product.category.name.replace(/s$/, "");
    // "Vintage Garden Bench - Gar917" -> "Vintage"
    const adjective = product.name.split(" ")[0];
    product.description = buildDescription(
      adjective,
      singular,
      product.roomTypes?.[0]?.name,
    );
    await product.save();
    described++;
  }
  console.log(`Rewrote ${described} descriptions.`);

  // --- Missing images -----------------------------------------------
  // One category ("Shoe Racks") came back empty from Unsplash during the
  // seed because its search phrase was too specific, leaving its products
  // with no photography at all. Retries with progressively broader terms.
  const imagelessProducts = await Product.find({ images: { $size: 0 } }).populate(
    "category",
    "name",
  );

  const byCategory = new Map();
  for (const product of imagelessProducts) {
    const name = product.category?.name;
    if (!name) continue;
    if (!byCategory.has(name)) byCategory.set(name, []);
    byCategory.get(name).push(product);
  }

  console.log(`Products with no images: ${imagelessProducts.length} across ${byCategory.size} categor(y/ies)`);

  for (const [categoryName, categoryProducts] of byCategory) {
    const queries = [
      `${categoryName.toLowerCase()} furniture`,
      categoryName.toLowerCase(),
      categoryName.replace(/s$/, "").toLowerCase(),
    ];

    let photos = [];
    for (const query of queries) {
      photos = await searchUnsplashPhotos(query, 6);
      console.log(`  "${categoryName}" — query "${query}" returned ${photos.length}`);
      if (photos.length) break;
    }

    if (!photos.length) {
      console.warn(`  "${categoryName}" — no Unsplash results for any query, skipped.`);
      continue;
    }

    const folder = `nestro/products/${categoryName.toLowerCase().replace(/\s+/g, "-")}`;
    const uploaded = [];
    for (const photo of photos) {
      try {
        const result = await cloudinary.uploader.upload(
          `${photo.rawUrl}?w=1600&q=80&fit=crop&auto=format`,
          { folder },
        );
        uploaded.push({ url: result.secure_url, publicId: result.public_id });
      } catch (error) {
        console.warn(`    upload failed:`, error.message);
      }
    }

    for (const product of categoryProducts) {
      product.images = [...uploaded]
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.min(3, uploaded.length));
      await product.save();
    }
    console.log(`  "${categoryName}" — ${uploaded.length} photos, applied to ${categoryProducts.length} products.`);
  }

  await mongoose.disconnect();
  process.exit(0);
};

backfill().catch((error) => {
  console.error("Backfill failed:", error);
  process.exit(1);
});
