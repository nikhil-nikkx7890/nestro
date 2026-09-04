import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import cloudinary from "../config/cloudinary.js";
import { searchUnsplashPhotos } from "../utils/unsplash.js";
import { generateUniqueSku } from "../utils/generateUniqueSku.js";

import Category from "../models/category.model.js";
import Brand from "../models/brand.model.js";
import Material from "../models/material.model.js";
import Color from "../models/color.model.js";
import RoomType from "../models/roomType.model.js";
import Product from "../models/product.model.js";
import ProductVariant from "../models/productVariant.model.js";

/**
 * Populates a realistic-scale Product + Variant catalog (600+ combined
 * entries) on top of the existing Master Data seed (`npm run seed`).
 *
 * Photography: 12 photos per Category, fetched from the Unsplash Search
 * API (real, licensed, dynamically sourced — not hand-picked URLs that can
 * silently rot) and uploaded to Cloudinary exactly once per Category, then
 * reused across every Product in that Category. This keeps Cloudinary
 * usage to ~300 one-time uploads total instead of one per Product.
 *
 * Destructive by design (same convention as seed.js): clears existing
 * Products and Variants before inserting, since this is demo catalog data,
 * not real customer-facing inventory. Master Data is untouched.
 */

// Category name -> { singular label used in generated product names, Unsplash search query }
const CATEGORY_META = {
  Sofas: { singular: "Sofa", query: "sofa furniture", priceRange: [25000, 120000] },
  Beds: { singular: "Bed", query: "bed frame furniture", priceRange: [15000, 90000] },
  "Dining Tables": { singular: "Dining Table", query: "dining table furniture", priceRange: [12000, 70000] },
  Chairs: { singular: "Chair", query: "chair furniture", priceRange: [2500, 15000] },
  Wardrobes: { singular: "Wardrobe", query: "wardrobe closet furniture", priceRange: [18000, 80000] },
  Bookshelves: { singular: "Bookshelf", query: "bookshelf furniture", priceRange: [5000, 30000] },
  "Coffee Tables": { singular: "Coffee Table", query: "coffee table furniture", priceRange: [3500, 20000] },
  "TV Units": { singular: "TV Unit", query: "tv unit furniture", priceRange: [6000, 35000] },
  "Office Desks": { singular: "Office Desk", query: "office desk furniture", priceRange: [5000, 25000] },
  "Bar Stools": { singular: "Bar Stool", query: "bar stool furniture", priceRange: [2000, 8000] },
  Recliners: { singular: "Recliner", query: "recliner chair furniture", priceRange: [15000, 60000] },
  Ottomans: { singular: "Ottoman", query: "ottoman furniture", priceRange: [2500, 12000] },
  Nightstands: { singular: "Nightstand", query: "nightstand furniture", priceRange: [2000, 10000] },
  "Bunk Beds": { singular: "Bunk Bed", query: "bunk bed furniture", priceRange: [20000, 70000] },
  "Rocking Chairs": { singular: "Rocking Chair", query: "rocking chair furniture", priceRange: [4000, 18000] },
  "Console Tables": { singular: "Console Table", query: "console table furniture", priceRange: [4000, 20000] },
  "Shoe Racks": { singular: "Shoe Rack", query: "shoe rack furniture", priceRange: [1500, 8000] },
  "Room Dividers": { singular: "Room Divider", query: "room divider screen", priceRange: [3000, 15000] },
  "Bean Bags": { singular: "Bean Bag", query: "bean bag chair", priceRange: [1200, 6000] },
  "Study Tables": { singular: "Study Table", query: "study table desk", priceRange: [4000, 18000] },
  "Dressing Tables": { singular: "Dressing Table", query: "dressing table furniture", priceRange: [6000, 28000] },
  "Kitchen Racks": { singular: "Kitchen Rack", query: "kitchen rack storage", priceRange: [2000, 10000] },
  "Shoe Cabinets": { singular: "Shoe Cabinet", query: "shoe cabinet furniture", priceRange: [3500, 15000] },
  "Side Tables": { singular: "Side Table", query: "side table furniture", priceRange: [1800, 9000] },
  "Garden Benches": { singular: "Garden Bench", query: "garden bench outdoor furniture", priceRange: [4000, 20000] },
};

const STYLE_ADJECTIVES = [
  "Nordic", "Classic", "Modern", "Compact", "Royal", "Urban",
  "Rustic", "Minimalist", "Vintage", "Coastal", "Industrial", "Heritage",
];

const PRODUCTS_PER_CATEGORY = 6;
const IMAGES_PER_CATEGORY = 12;
const MIN_VARIANTS_PER_PRODUCT = 2;
const MAX_VARIANTS_PER_PRODUCT = 4;

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pickRandom = (arr, n) => [...arr].sort(() => Math.random() - 0.5).slice(0, n);
const pickOne = (arr) => arr[randomInt(0, arr.length - 1)];

const weightedStatus = () => {
  const r = Math.random();
  if (r < 0.8) return "published";
  if (r < 0.92) return "draft";
  return "archived";
};

const withSizeParams = (url) => `${url}?w=1600&q=80&fit=crop&auto=format`;

const uploadOneImage = async (rawUrl, folder) => {
  const result = await cloudinary.uploader.upload(withSizeParams(rawUrl), { folder });
  return { url: result.secure_url, publicId: result.public_id };
};

/** Fetches + uploads IMAGES_PER_CATEGORY photos for one Category, once. */
const buildCategoryImagePool = async (categoryName, query) => {
  console.log(`  Fetching ${IMAGES_PER_CATEGORY} photos for "${categoryName}" (query: "${query}")...`);
  const photos = await searchUnsplashPhotos(query, IMAGES_PER_CATEGORY);

  if (photos.length === 0) {
    console.warn(`    No Unsplash results for "${query}" — skipping images for this category.`);
    return [];
  }

  const uploaded = [];
  for (const photo of photos) {
    try {
      uploaded.push(await uploadOneImage(photo.rawUrl, `nestro/products/${categoryName.toLowerCase().replace(/\s+/g, "-")}`));
    } catch (error) {
      console.warn(`    Failed to upload one photo for "${categoryName}":`, error.message);
    }
  }

  console.log(`    Uploaded ${uploaded.length}/${photos.length} photos.`);
  return uploaded;
};

const buildProductDocs = (category, brands, roomTypes, imagePool) => {
  const meta = CATEGORY_META[category.name];
  const adjectives = pickRandom(STYLE_ADJECTIVES, PRODUCTS_PER_CATEGORY);

  return adjectives.map((adjective) => ({
    name: `${adjective} ${meta.singular} - ${category.name.slice(0, 3).toUpperCase()}${randomInt(100, 999)}`,
    description: `A ${adjective.toLowerCase()} ${meta.singular.toLowerCase()}, part of Nestro's ${category.name} collection.`,
    category: category._id,
    brand: pickOne(brands)._id,
    roomTypes: pickRandom(roomTypes, randomInt(1, Math.min(2, roomTypes.length))).map((r) => r._id),
    images: imagePool.length ? pickRandom(imagePool, Math.min(3, imagePool.length)) : [],
    status: weightedStatus(),
  }));
};

const buildVariantDocs = async (product, materials, colors, priceRange) => {
  const variantCount = randomInt(MIN_VARIANTS_PER_PRODUCT, MAX_VARIANTS_PER_PRODUCT);
  const usedPairs = new Set();
  const docs = [];

  while (docs.length < variantCount && usedPairs.size < materials.length * colors.length) {
    const material = pickOne(materials);
    const color = pickOne(colors);
    const pairKey = `${material._id}-${color._id}`;
    if (usedPairs.has(pairKey)) continue;
    usedPairs.add(pairKey);

    const price = randomInt(priceRange[0], priceRange[1]);
    const hasCompareAt = Math.random() < 0.4;

    const sku = await generateUniqueSku(ProductVariant, {
      product: { _id: product._id, name: product.name },
      material: { _id: material._id, name: material.name },
      color: { _id: color._id, name: color.name },
    });

    docs.push({
      product: product._id,
      sku,
      price,
      compareAtPrice: hasCompareAt ? Math.round(price * (1 + Math.random() * 0.3 + 0.1)) : null,
      material: material._id,
      color: color._id,
      stock: randomInt(0, 60),
      isActive: Math.random() > 0.05,
    });
  }

  return docs;
};

const seedCatalog = async () => {
  await connectDB();

  const [categories, brands, materials, colors, roomTypes] = await Promise.all([
    Category.find({ isActive: true }),
    Brand.find({ isActive: true }),
    Material.find({ isActive: true }),
    Color.find({ isActive: true }),
    RoomType.find({ isActive: true }),
  ]);

  if (!categories.length || !brands.length || !materials.length || !colors.length || !roomTypes.length) {
    console.error(
      "Master Data is missing or empty. Run `npm run seed` first, then re-run this script.",
    );
    await mongoose.disconnect();
    process.exit(1);
  }

  const freshRun = process.argv.includes("--fresh");

  if (freshRun) {
    console.log("--fresh flag set: clearing ALL existing Products and Variants first...");
    await ProductVariant.deleteMany({});
    await Product.deleteMany({});
  } else {
    console.log(
      "Resumable mode (default): categories that already have Products are skipped. Pass --fresh to wipe everything and start over.",
    );
  }

  let totalProducts = 0;
  let totalVariants = 0;

  for (const category of categories) {
    const meta = CATEGORY_META[category.name];
    if (!meta) {
      console.warn(`No CATEGORY_META entry for "${category.name}" — skipping.`);
      continue;
    }

    if (!freshRun && (await Product.exists({ category: category._id }))) {
      console.log(`\nCategory: ${category.name} — already seeded, skipping.`);
      continue;
    }

    console.log(`\nCategory: ${category.name}`);
    const imagePool = await buildCategoryImagePool(category.name, meta.query);

    const productDocs = buildProductDocs(category, brands, roomTypes, imagePool);

    // Sequential, not Promise.all: pre-save hooks call generateUniqueSlug,
    // which reads-then-writes the slug uniqueness check — running many of
    // these concurrently against the same collection risks two documents
    // racing past the same "does this slug exist yet" check.
    const createdProducts = [];
    for (const doc of productDocs) {
      createdProducts.push(await Product.create(doc));
    }
    totalProducts += createdProducts.length;
    console.log(`  Created ${createdProducts.length} products.`);

    let categoryVariantCount = 0;
    for (const product of createdProducts) {
      const variantDocs = await buildVariantDocs(product, materials, colors, meta.priceRange);
      await ProductVariant.insertMany(variantDocs);
      categoryVariantCount += variantDocs.length;
    }
    totalVariants += categoryVariantCount;
    console.log(`  Created ${categoryVariantCount} variants.`);
  }

  console.log(
    `\nDone. ${totalProducts} products + ${totalVariants} variants = ${totalProducts + totalVariants} total entries.`,
  );

  await mongoose.disconnect();
  process.exit(0);
};

seedCatalog().catch((error) => {
  console.error("Catalog seeding failed:", error);
  process.exit(1);
});
