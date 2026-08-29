import Category from "../../src/models/category.model.js";
import Brand from "../../src/models/brand.model.js";
import RoomType from "../../src/models/roomType.model.js";
import Material from "../../src/models/material.model.js";
import Color from "../../src/models/color.model.js";
import Product from "../../src/models/product.model.js";
import ProductVariant from "../../src/models/productVariant.model.js";

/**
 * Product and Variant both require real Master Data documents to exist
 * (category, brand, roomTypes, material, color) — the controllers check
 * referential existence before allowing a create/update. This helper
 * creates one of each so every Product/Variant test doesn't repeat the
 * same setup boilerplate.
 */
export const createMasterData = async () => {
  const category = await Category.create({ name: "Sofas" });
  const brand = await Brand.create({ name: "Nestro Home" });
  const roomType = await RoomType.create({ name: "Living Room" });
  const material = await Material.create({ name: "Sheesham Wood" });
  const color = await Color.create({ name: "Walnut Brown", hexCode: "#8B5E3C" });

  return { category, brand, roomType, material, color };
};

/**
 * Creates a Product that references the given Master Data docs (usually
 * the ones from createMasterData()). Used by Master Data delete tests to
 * prove the referential-integrity block (ADR-024) actually fires.
 */
export const createTestProduct = async ({ category, brand, roomType }) =>
  Product.create({
    name: "Test Sofa",
    category: category._id,
    brand: brand._id,
    roomTypes: [roomType._id],
  });

/**
 * Creates a Variant on the given product that references the given
 * material/color. Used by Material/Color delete tests, since those two
 * are referenced by ProductVariant rather than Product directly.
 */
export const createTestVariant = async (product, { material, color }) =>
  ProductVariant.create({
    product: product._id,
    sku: "TEST-SKU-0001",
    price: 100000,
    material: material._id,
    color: color._id,
  });
