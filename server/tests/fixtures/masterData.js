import Category from "../../src/models/category.model.js";
import Brand from "../../src/models/brand.model.js";
import RoomType from "../../src/models/roomType.model.js";
import Material from "../../src/models/material.model.js";
import Color from "../../src/models/color.model.js";

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
