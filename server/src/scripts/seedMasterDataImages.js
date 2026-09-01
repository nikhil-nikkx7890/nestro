import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import cloudinary from "../config/cloudinary.js";
import Category from "../models/category.model.js";
import RoomType from "../models/roomType.model.js";
import Material from "../models/material.model.js";

/**
 * Backfills real, curated stock photography onto Category, RoomType, and
 * Material — the same idea and reasoning as seedProductImages.js (ADR-045),
 * extended to Master Data (ADR-049). Category and RoomType images already
 * render on the storefront homepage's Shop by Category/Room grids; Material
 * gets a texture/swatch photo rather than a literal product photo.
 *
 * Brand is deliberately NOT included — a Brand's image is a logo, and a
 * stock interior/texture photo in a logo slot doesn't make sense the way
 * it does for a Category, Room, or Material (see ADR-049).
 *
 * Each entity gets exactly one image (unlike Product's images[] array,
 * these models have a single `image: {url, publicId}` field). Skips any
 * document that already has one, so it's safe to re-run.
 */
const CATEGORY_IMAGES = {
  Sofas: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc",
  Beds: "https://images.unsplash.com/photo-1635594202056-9ea3b497e5c0",
  "Dining Tables": "https://images.unsplash.com/photo-1604578762246-41134e37f9cc",
  Chairs: "https://images.unsplash.com/photo-1563418536419-3a3ad6ef5efd",
  Wardrobes: "https://images.unsplash.com/photo-1672137233327-37b0c1049e77",
  Bookshelves: "https://images.unsplash.com/photo-1593430980369-68efc5a5eb34",
  "Coffee Tables": "https://images.unsplash.com/photo-1542372147193-a7aca54189cd",
  "TV Units": "https://images.unsplash.com/photo-1785940926381-b00e46f5412a",
  "Office Desks": "https://images.unsplash.com/photo-1497215728101-856f4ea42174",
  "Bar Stools": "https://images.unsplash.com/photo-1583227061267-8428fb76fbfd",
  Recliners: "https://images.unsplash.com/photo-1759722666919-14db39a6f347",
  Ottomans: "https://images.unsplash.com/photo-1783685198920-117662e6c4f2",
  Nightstands: "https://images.unsplash.com/photo-1593194632872-3d19dab6e278",
  "Bunk Beds": "https://images.unsplash.com/photo-1723258343563-7d71a55d6dfa",
  "Rocking Chairs": "https://images.unsplash.com/photo-1711443418892-244b303a8cad",
  "Console Tables": "https://images.unsplash.com/photo-1609879938030-31acdeded104",
  "Shoe Racks": "https://images.unsplash.com/photo-1462927114214-6956d2fddd4e",
  "Room Dividers": "https://images.unsplash.com/photo-1698417945941-002d5764e98b",
  "Bean Bags": "https://images.unsplash.com/photo-1698041383729-38eb70ce7a08",
  "Study Tables": "https://images.unsplash.com/photo-1616400619175-5beda3a17896",
  "Dressing Tables": "https://images.unsplash.com/photo-1743058533210-303721a35d4a",
  "Kitchen Racks": "https://images.unsplash.com/photo-1580116270858-8a0d62b15426",
  "Shoe Cabinets": "https://images.unsplash.com/photo-1695552839440-c7e7a9e4eac7",
  "Side Tables": "https://images.unsplash.com/photo-1669274174844-0cc2598ad868",
  "Garden Benches": "https://images.unsplash.com/photo-1588406235219-0314e168c5e4",
};

const ROOM_TYPE_IMAGES = {
  "Living Room": "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92",
  Bedroom: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0",
  "Dining Room": "https://images.unsplash.com/photo-1600489000300-e590b381ce48",
  Kitchen: "https://images.unsplash.com/photo-1600489000022-c2086d79f9d4",
  "Home Office": "https://images.unsplash.com/photo-1693159682618-074078ed271e",
  "Kids Room": "https://images.unsplash.com/photo-1693034433366-57fbb0286641",
  "Guest Room": "https://images.unsplash.com/photo-1621215052063-6ed29c948b31",
  Balcony: "https://images.unsplash.com/photo-1630699376682-84df40131d22",
  "Study Room": "https://images.unsplash.com/photo-1613685303404-19f881533316",
  Entryway: "https://images.unsplash.com/photo-1704383014646-2123f9dc8137",
  Bathroom: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a",
  "Outdoor Patio": "https://images.unsplash.com/photo-1527359443443-84a48aec73d2",
  Nursery: "https://images.unsplash.com/photo-1542901689-8917f44e3541",
  "Game Room": "https://images.unsplash.com/photo-1495954222046-2c427ecb546d",
  "Home Theatre": "https://images.unsplash.com/photo-1756729924082-cd09778160fc",
  Library: "https://images.unsplash.com/photo-1509512693283-8178ed23e04c",
  "Utility Room": "https://images.unsplash.com/photo-1626806819282-2c1dc01a5e0c",
  "Laundry Room": "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1",
  Sunroom: "https://images.unsplash.com/photo-1623625434531-d130448273c1",
  Garage: "https://images.unsplash.com/photo-1586582636676-9ca2d4cedb9a",
  Attic: "https://images.unsplash.com/photo-1611991743247-4dd4e50c9c17",
  Basement: "https://images.unsplash.com/photo-1646592474094-342fbc28736c",
  Hallway: "https://images.unsplash.com/photo-1673101957944-1ca2d0d8cfe3",
  "Walk-in Closet": "https://images.unsplash.com/photo-1708397016786-8916880649b8",
  "Meditation Room": "https://images.unsplash.com/photo-1761971975858-c487bc10daab",
};

const MATERIAL_IMAGES = {
  "Solid Wood": "https://images.unsplash.com/photo-1635315619556-5826839a1bea",
  "Engineered Wood": "https://images.unsplash.com/photo-1639690381680-4f2f4ba2a2ec",
  "Sheesham Wood": "https://images.unsplash.com/photo-1624879904994-509be0b2adbd",
  "Ash Wood": "https://images.unsplash.com/photo-1611600700192-d87eaeed4f81",
  "Teak Wood": "https://images.unsplash.com/photo-1644925757334-d0397c01518c",
  "Mango Wood": "https://images.unsplash.com/photo-1621295693450-080546d2ec8e",
  "Acacia Wood": "https://images.unsplash.com/photo-1585773818428-b50bebdc2344",
  MDF: "https://images.unsplash.com/photo-1508948414348-13a52d2ec394",
  Plywood: "https://images.unsplash.com/photo-1611072337226-1140ab367200",
  "Particle Board": "https://images.unsplash.com/photo-1690768162439-7ca7a1813038",
  Metal: "https://images.unsplash.com/photo-1521459467264-802e2ef3141f",
  Iron: "https://images.unsplash.com/photo-1584384689201-e0bcbe2c7f1d",
  "Wrought Iron": "https://images.unsplash.com/photo-1566305977571-5666677c6e98",
  "Stainless Steel": "https://images.unsplash.com/photo-1545873509-33e944ca7655",
  Glass: "https://images.unsplash.com/photo-1714963810770-1506ea5806b7",
  Rattan: "https://images.unsplash.com/photo-1638780331467-1284e176308d",
  Cane: "https://images.unsplash.com/photo-1777332546255-818d0cc8aff9",
  Wicker: "https://images.unsplash.com/photo-1781232756159-97eba33dc051",
  Bamboo: "https://images.unsplash.com/photo-1577199019410-0d4567e04117",
  "Velvet Fabric": "https://images.unsplash.com/photo-1695728213930-93ced4114eb0",
  "Cotton Fabric": "https://images.unsplash.com/photo-1668956343245-c6330043be83",
  "Linen Upholstery": "https://images.unsplash.com/photo-1604493225443-a8cc19434aec",
  Leather: "https://images.unsplash.com/photo-1571829604981-ea159f94e5ad",
  "Faux Leather": "https://images.unsplash.com/photo-1615799998603-7c6270a45196",
  Marble: "https://images.unsplash.com/photo-1604147706283-d7119b5b822c",
};

const withSizeParams = (url) => `${url}?w=1200&q=80&fit=crop&auto=format`;

const uploadOneImage = async (url, folder) => {
  const result = await cloudinary.uploader.upload(withSizeParams(url), { folder });
  return { url: result.secure_url, publicId: result.public_id };
};

const seedGroup = async ({ Model, imageMap, folder, label }) => {
  const docs = await Model.find({ "image.url": { $in: [null, ""] } });

  if (docs.length === 0) {
    console.log(`${label}: nothing to do — every document already has an image.`);
    return;
  }

  console.log(`${label}: ${docs.length} document(s) with no image.`);

  for (const doc of docs) {
    const sourceUrl = imageMap[doc.name];

    if (!sourceUrl) {
      console.log(`  "${doc.name}" — no curated image for this name, skipped.`);
      continue;
    }

    try {
      doc.image = await uploadOneImage(sourceUrl, folder);
      await doc.save();
      console.log(`  "${doc.name}" — image uploaded.`);
    } catch (error) {
      console.error(`  "${doc.name}" — failed to upload image:`, error.message);
    }
  }
};

const seedMasterDataImages = async () => {
  await connectDB();

  await seedGroup({
    Model: Category,
    imageMap: CATEGORY_IMAGES,
    folder: "nestro/categories",
    label: "Categories",
  });
  await seedGroup({
    Model: RoomType,
    imageMap: ROOM_TYPE_IMAGES,
    folder: "nestro/room-types",
    label: "Room Types",
  });
  await seedGroup({
    Model: Material,
    imageMap: MATERIAL_IMAGES,
    folder: "nestro/materials",
    label: "Materials",
  });

  console.log("Done.");
  await mongoose.disconnect();
  process.exit(0);
};

seedMasterDataImages().catch((error) => {
  console.error("Master data image seeding failed:", error);
  process.exit(1);
});
