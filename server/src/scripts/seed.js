import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";

import Category from "../models/category.model.js";
import Brand from "../models/brand.model.js";
import Color from "../models/color.model.js";
import Material from "../models/material.model.js";
import RoomType from "../models/roomType.model.js";
import slugify from "../utils/slugify.js";

// Helper: returns a Date `n` days in the past, so seeded rows have
// staggered createdAt values instead of all sharing the same instant.
// This matters for testing "sort by newest/oldest" meaningfully.
const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

const categories = [
  { name: "Sofas", displayOrder: 1 },
  { name: "Beds", displayOrder: 2 },
  { name: "Dining Tables", displayOrder: 3 },
  { name: "Chairs", displayOrder: 4 },
  { name: "Wardrobes", displayOrder: 5 },
  { name: "Bookshelves", displayOrder: 6 },
  { name: "Coffee Tables", displayOrder: 7 },
  { name: "TV Units", displayOrder: 8 },
  { name: "Office Desks", displayOrder: 9 },
  { name: "Bar Stools", displayOrder: 10 },
  { name: "Recliners", displayOrder: 11 },
  { name: "Ottomans", displayOrder: 12 },
  { name: "Nightstands", displayOrder: 13 },
  { name: "Bunk Beds", displayOrder: 14 },
  { name: "Rocking Chairs", displayOrder: 15, isActive: false },
  { name: "Console Tables", displayOrder: 16 },
  { name: "Shoe Racks", displayOrder: 17 },
  { name: "Room Dividers", displayOrder: 18, isActive: false },
  { name: "Bean Bags", displayOrder: 19 },
  { name: "Study Tables", displayOrder: 20 },
  { name: "Dressing Tables", displayOrder: 21 },
  { name: "Kitchen Racks", displayOrder: 22 },
  { name: "Shoe Cabinets", displayOrder: 23, isActive: false },
  { name: "Side Tables", displayOrder: 24 },
  { name: "Garden Benches", displayOrder: 25 },
].map((c, i) => ({
  ...c,
  isActive: c.isActive ?? true,
  createdAt: daysAgo(50 - i),
  slug: slugify(c.name),
}));

const brands = [
  "Nestro Home", "Urban Ply", "WoodCraft Co", "Casa Bella", "Comfort Loom",
  "Solidwood Studio", "Maple & Co", "Nordic Nest", "TeakTales", "Oakwood Living",
  "Metro Furnish", "Cozy Nook", "Loft & Living", "Timber Trail", "Rustic Roots",
  "Elmwood Interiors", "Zenith Furniture", "Willow & Oak", "Craft House", "Pinecrest",
  "Urban Nest", "Heritage Wood", "Modern Living Co", "Sculpt Furniture", "Haven Home",
].map((name, i) => ({
  name,
  slug: slugify(name),
  isActive: i % 6 !== 0, // most active, a few inactive to test the filter
  createdAt: daysAgo(45 - i),
}));

const materials = [
  "Solid Wood", "Engineered Wood", "Sheesham Wood", "Teak Wood", "Mango Wood",
  "MDF", "Plywood", "Metal", "Iron", "Glass",
  "Rattan", "Cane", "Velvet Fabric", "Leather", "Faux Leather",
  "Cotton Fabric", "Marble", "Acacia Wood", "Bamboo", "Particle Board",
  "Wrought Iron", "Stainless Steel", "Wicker", "Linen Upholstery", "Ash Wood",
].map((name, i) => ({
  name,
  slug: slugify(name),
  isActive: i % 7 !== 0,
  createdAt: daysAgo(35 - i),
}));

const roomTypes = [
  "Living Room", "Bedroom", "Dining Room", "Kitchen", "Home Office",
  "Kids Room", "Guest Room", "Balcony", "Study Room", "Entryway",
  "Bathroom", "Outdoor Patio", "Nursery", "Game Room", "Home Theatre",
  "Library", "Utility Room", "Laundry Room", "Sunroom", "Garage",
  "Attic", "Basement", "Hallway", "Walk-in Closet", "Meditation Room",
].map((name, i) => ({
  name,
  slug: slugify(name),
  isActive: i % 8 !== 0,
  createdAt: daysAgo(30 - i),
}));

const colors = [
  { name: "Walnut Brown", hexCode: "#5C4033" },
  { name: "Ebony Black", hexCode: "#1C1C1C" },
  { name: "Ivory White", hexCode: "#FFFFF0" },
  { name: "Charcoal Grey", hexCode: "#36454F" },
  { name: "Natural Oak", hexCode: "#C19A6B" },
  { name: "Mahogany Red", hexCode: "#4E2A1E" },
  { name: "Beige", hexCode: "#F5F5DC" },
  { name: "Navy Blue", hexCode: "#1B1F3B" },
  { name: "Olive Green", hexCode: "#708238" },
  { name: "Rustic Brown", hexCode: "#8B5E3C" },
  { name: "Antique Gold", hexCode: "#C5A028" },
  { name: "Pearl White", hexCode: "#F0EAD6" },
  { name: "Slate Grey", hexCode: "#708090" },
  { name: "Teal", hexCode: "#367588" },
  { name: "Maroon", hexCode: "#800000" },
  { name: "Cream", hexCode: "#FFFDD0" },
  { name: "Coffee Brown", hexCode: "#6F4E37" },
  { name: "Graphite", hexCode: "#383838" },
  { name: "Sand Beige", hexCode: "#E1C699" },
  { name: "Forest Green", hexCode: "#228B22" },
  { name: "Wine Red", hexCode: "#722F37" },
  { name: "Sky Blue", hexCode: "#87CEEB" },
  { name: "Chestnut", hexCode: "#954535" },
  { name: "Taupe", hexCode: "#483C32" },
  { name: "Blush Pink", hexCode: "#FEC5BB" },
].map((c, i) => ({
  ...c,
  slug: slugify(c.name),
  isActive: i % 6 !== 0,
  createdAt: daysAgo(25 - i),
}));

const seed = async () => {
  await connectDB();

  console.log("Clearing existing Master Data...");
  await Promise.all([
    Category.deleteMany({}),
    Brand.deleteMany({}),
    Color.deleteMany({}),
    Material.deleteMany({}),
    RoomType.deleteMany({}),
  ]);

  console.log("Inserting seed data...");
  await Category.insertMany(categories);
  await Brand.insertMany(brands);
  await Color.insertMany(colors);
  await Material.insertMany(materials);
  await RoomType.insertMany(roomTypes);

  console.log(
    `Seeded ${categories.length} categories, ${brands.length} brands, ${colors.length} colors, ${materials.length} materials, ${roomTypes.length} room types.`,
  );

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((error) => {
  console.error("Seeding failed:", error);
  process.exit(1);
});
