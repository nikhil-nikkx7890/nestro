import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import cloudinary from "../config/cloudinary.js";
import Product from "../models/product.model.js";
import Category from "../models/category.model.js";

/**
 * Backfills real product photography onto seeded Products that don't have
 * any yet (ADR-045). Not a fake-data generator — every URL below is a real,
 * freely-licensed Unsplash photo, uploaded through Cloudinary (the same
 * pipeline every admin-uploaded image goes through) rather than checked
 * into the repo as static files. The resulting { url, publicId } is stored
 * on the Product exactly like an admin's own upload — no special-cased
 * rendering path anywhere in the app knows this image came from a script.
 *
 * Curated per Category name so a Sofa gets sofa photos, a Bed gets bed
 * photos, etc. FALLBACK_IMAGES covers any Category not in the map (a new
 * one added after this script was written, or a rare/inactive one) so a
 * product is never skipped just for having an uncurated category.
 */
const CATEGORY_IMAGES = {
  Sofas: [
    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc",
    "https://images.unsplash.com/photo-1634712282287-14ed57b9cc89",
    "https://images.unsplash.com/photo-1567016432779-094069958ea5",
  ],
  Beds: [
    "https://images.unsplash.com/photo-1635594202056-9ea3b497e5c0",
    "https://images.unsplash.com/photo-1690957530220-98bacb3c1163",
    "https://images.unsplash.com/photo-1560185128-e173042f79dd",
  ],
  "Dining Tables": [
    "https://images.unsplash.com/photo-1604578762246-41134e37f9cc",
    "https://images.unsplash.com/photo-1657524398377-567034729507",
    "https://images.unsplash.com/photo-1616486886892-ff366aa67ba4",
  ],
  Chairs: [
    "https://images.unsplash.com/photo-1563418536419-3a3ad6ef5efd",
    "https://images.unsplash.com/photo-1758448755952-42b404bc6f39",
    "https://images.unsplash.com/photo-1771573753453-70e26aa92246",
  ],
  Wardrobes: [
    "https://images.unsplash.com/photo-1672137233327-37b0c1049e77",
    "https://images.unsplash.com/photo-1630699144552-b2b60b277b75",
    "https://images.unsplash.com/photo-1630699293155-2cc65a890604",
  ],
  Bookshelves: [
    "https://images.unsplash.com/photo-1593430980369-68efc5a5eb34",
    "https://images.unsplash.com/photo-1521587760476-6c12a4b040da",
    "https://images.unsplash.com/photo-1457369804613-52c61a468e7d",
  ],
  "Coffee Tables": [
    "https://images.unsplash.com/photo-1542372147193-a7aca54189cd",
    "https://images.unsplash.com/photo-1581428982868-e410dd047a90",
    "https://images.unsplash.com/photo-1594125674956-61a9b49c8ecc",
  ],
  "TV Units": [
    "https://images.unsplash.com/photo-1785940926381-b00e46f5412a",
    "https://images.unsplash.com/photo-1774716925888-190de2471de2",
    "https://images.unsplash.com/photo-1781032044213-571bc1faa592",
  ],
  "Office Desks": [
    "https://images.unsplash.com/photo-1497215728101-856f4ea42174",
    "https://images.unsplash.com/photo-1535957998253-26ae1ef29506",
    "https://images.unsplash.com/photo-1497366754035-f200968a6e72",
  ],
  "Bar Stools": [
    "https://images.unsplash.com/photo-1583227061267-8428fb76fbfd",
    "https://images.unsplash.com/photo-1571079570759-8b8800f7c412",
    "https://images.unsplash.com/photo-1560185127-6ed189bf02f4",
  ],
  Recliners: [
    "https://images.unsplash.com/photo-1759722666919-14db39a6f347",
    "https://images.unsplash.com/photo-1757969687802-82493a29047a",
    "https://images.unsplash.com/photo-1684351631201-72e3df870986",
  ],
  Ottomans: [
    "https://images.unsplash.com/photo-1783685198920-117662e6c4f2",
    "https://images.unsplash.com/photo-1764349109513-437ffb751893",
    "https://images.unsplash.com/photo-1565374369705-acde12f3caa2",
  ],
  Nightstands: [
    "https://images.unsplash.com/photo-1593194632872-3d19dab6e278",
    "https://images.unsplash.com/photo-1585128719715-46776b56a0d1",
    "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af",
  ],
  "Bunk Beds": [
    "https://images.unsplash.com/photo-1723258343563-7d71a55d6dfa",
    "https://images.unsplash.com/photo-1664999348418-f01c705871d7",
    "https://images.unsplash.com/photo-1709805619372-40de3f158e83",
  ],
  "Console Tables": [
    "https://images.unsplash.com/photo-1609879938030-31acdeded104",
    "https://images.unsplash.com/photo-1752061289543-de2e7720b029",
    "https://images.unsplash.com/photo-1610458131353-1f3f843bb0d6",
  ],
  "Shoe Racks": [
    "https://images.unsplash.com/photo-1462927114214-6956d2fddd4e",
    "https://images.unsplash.com/photo-1595593795628-5e32198b3ee4",
    "https://images.unsplash.com/photo-1630828768689-12914561ee93",
  ],
  "Bean Bags": [
    "https://images.unsplash.com/photo-1698041383729-38eb70ce7a08",
    "https://images.unsplash.com/photo-1637782855823-5423b6afb07b",
    "https://images.unsplash.com/photo-1637782854339-d1ea17f68d84",
  ],
  "Study Tables": [
    "https://images.unsplash.com/photo-1616400619175-5beda3a17896",
    "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e",
    "https://images.unsplash.com/photo-1576506542790-51244b486a6b",
  ],
  "Dressing Tables": [
    "https://images.unsplash.com/photo-1743058533210-303721a35d4a",
    "https://images.unsplash.com/photo-1513161455079-7dc1de15ef3e",
    "https://images.unsplash.com/photo-1686109831633-d35231b5c623",
  ],
  "Kitchen Racks": [
    "https://images.unsplash.com/photo-1580116270858-8a0d62b15426",
    "https://images.unsplash.com/photo-1769515376350-bcff86d49499",
    "https://images.unsplash.com/photo-1760895307365-98c87b69f9e8",
  ],
  "Side Tables": [
    "https://images.unsplash.com/photo-1669274174844-0cc2598ad868",
    "https://images.unsplash.com/photo-1752061143360-623e42941ab4",
    "https://images.unsplash.com/photo-1748887522064-5be67910f6db",
  ],
  "Garden Benches": [
    "https://images.unsplash.com/photo-1588406235219-0314e168c5e4",
    "https://images.unsplash.com/photo-1607570838997-65f270035031",
    "https://images.unsplash.com/photo-1685633224402-3410df959f98",
  ],
};

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1634712282287-14ed57b9cc89",
  "https://images.unsplash.com/photo-1567016526105-22da7c13161a",
  "https://images.unsplash.com/photo-1679558879549-433b75ae99f0",
];

// Unsplash's imgix backend honors these as query params — a reasonable
// fixed source resolution/quality for Cloudinary to fetch and re-host.
const withSizeParams = (url) => `${url}?w=1600&q=80&fit=crop&auto=format`;

const uploadOneImage = async (url) => {
  const result = await cloudinary.uploader.upload(withSizeParams(url), {
    folder: "nestro/products",
  });
  return { url: result.secure_url, publicId: result.public_id };
};

const seedProductImages = async () => {
  await connectDB();

  const products = await Product.find({ images: { $size: 0 } }).populate("category", "name");

  if (products.length === 0) {
    console.log("No products without images — nothing to do.");
    await mongoose.disconnect();
    process.exit(0);
  }

  console.log(`Found ${products.length} product(s) with no images.`);

  for (const product of products) {
    const categoryName = product.category?.name;
    const sourceUrls = CATEGORY_IMAGES[categoryName] || FALLBACK_IMAGES;

    if (!CATEGORY_IMAGES[categoryName]) {
      console.log(
        `  "${product.name}" — no curated set for category "${categoryName}", using the generic fallback.`,
      );
    }

    try {
      const uploaded = [];
      for (const url of sourceUrls) {
        uploaded.push(await uploadOneImage(url));
      }

      product.images = uploaded;
      await product.save();

      console.log(`  "${product.name}" (${categoryName || "no category"}) — uploaded ${uploaded.length} image(s).`);
    } catch (error) {
      console.error(`  "${product.name}" — failed to upload images:`, error.message);
    }
  }

  console.log("Done.");
  await mongoose.disconnect();
  process.exit(0);
};

seedProductImages().catch((error) => {
  console.error("Product image seeding failed:", error);
  process.exit(1);
});
