import request from "supertest";
import mongoose from "mongoose";
import app from "../src/app.js";
import Product from "../src/models/product.model.js";
import ProductVariant from "../src/models/productVariant.model.js";
import Category from "../src/models/category.model.js";
import Brand from "../src/models/brand.model.js";
import Material from "../src/models/material.model.js";
import Color from "../src/models/color.model.js";
import { connectTestDB, clearTestDB, disconnectTestDB } from "./setup/testDb.js";
import { createMasterData } from "./fixtures/masterData.js";
import { createAdminAgent, createCustomerAgent } from "./fixtures/auth.js";

beforeAll(async () => {
  await connectTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

describe("POST /api/products", () => {
  it("creates a product when the payload is valid", async () => {
    const adminAgent = await createAdminAgent();
    const { category, brand, roomType } = await createMasterData();

    const res = await adminAgent.post("/api/products").send({
      name: "Test Sofa",
      category: category._id.toString(),
      brand: brand._id.toString(),
      roomTypes: [roomType._id.toString()],
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe("Test Sofa");
    expect(res.body.data.slug).toBe("test-sofa");
    expect(res.body.data.category.name).toBe("Sofas");
    expect(res.body.data.variantCount).toBe(0);

    const inDb = await Product.findById(res.body.data._id);
    expect(inDb).not.toBeNull();
  });

  it("rejects a product that references a category that doesn't exist", async () => {
    const adminAgent = await createAdminAgent();
    const { brand, roomType } = await createMasterData();
    const fakeCategoryId = new mongoose.Types.ObjectId().toString();

    const res = await adminAgent.post("/api/products").send({
      name: "Test Sofa",
      category: fakeCategoryId,
      brand: brand._id.toString(),
      roomTypes: [roomType._id.toString()],
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Category not found/i);
  });

  it("rejects the request when no one is logged in (ADR-035)", async () => {
    const { category, brand, roomType } = await createMasterData();

    const res = await request(app).post("/api/products").send({
      name: "Test Sofa",
      category: category._id.toString(),
      brand: brand._id.toString(),
      roomTypes: [roomType._id.toString()],
    });

    expect(res.status).toBe(401);
  });
});

describe("GET /api/products/:productId", () => {
  it("returns the product when it exists", async () => {
    const { category, brand, roomType } = await createMasterData();
    // status: "published" — an anonymous request (used below) only ever
    // sees published products (ADR-036); this test is about existence,
    // not status visibility, which is covered separately below.
    const product = await Product.create({
      name: "Test Sofa",
      category: category._id,
      brand: brand._id,
      roomTypes: [roomType._id],
      status: "published",
    });

    const res = await request(app).get(`/api/products/${product._id}`);

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("Test Sofa");
  });

  it("returns 404 when the product doesn't exist", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();

    const res = await request(app).get(`/api/products/${fakeId}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

describe("DELETE /api/products/:productId", () => {
  it("blocks deleting a product that still has variants, unless confirmCascade=true", async () => {
    const adminAgent = await createAdminAgent();
    const { category, brand, roomType, material, color } = await createMasterData();
    const product = await Product.create({
      name: "Test Sofa",
      category: category._id,
      brand: brand._id,
      roomTypes: [roomType._id],
    });
    await ProductVariant.create({
      product: product._id,
      sku: "TEST-SKU-0001",
      price: 100000,
      material: material._id,
      color: color._id,
    });

    const withoutConfirm = await adminAgent.delete(`/api/products/${product._id}`);
    expect(withoutConfirm.status).toBe(409);
    expect(await Product.findById(product._id)).not.toBeNull();

    const withConfirm = await adminAgent.delete(
      `/api/products/${product._id}?confirmCascade=true`,
    );
    expect(withConfirm.status).toBe(200);
    expect(await Product.findById(product._id)).toBeNull();
    expect(await ProductVariant.countDocuments({ product: product._id })).toBe(0);
  });

  it("returns 404 when deleting a product that doesn't exist", async () => {
    const adminAgent = await createAdminAgent();
    const fakeId = new mongoose.Types.ObjectId().toString();

    const res = await adminAgent.delete(`/api/products/${fakeId}`);

    expect(res.status).toBe(404);
  });
});

describe("Optional-auth status visibility (ADR-036)", () => {
  const createProductsAcrossStatuses = async () => {
    const { category, brand, roomType } = await createMasterData();
    const base = { category: category._id, brand: brand._id, roomTypes: [roomType._id] };

    const draft = await Product.create({ ...base, name: "Draft Sofa", status: "draft" });
    const published = await Product.create({
      ...base,
      name: "Published Sofa",
      status: "published",
    });
    const archived = await Product.create({
      ...base,
      name: "Archived Sofa",
      status: "archived",
    });

    return { draft, published, archived };
  };

  describe("GET /api/products", () => {
    it("returns products of every status to a logged-in admin", async () => {
      const adminAgent = await createAdminAgent();
      await createProductsAcrossStatuses();

      const res = await adminAgent.get("/api/products");

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(3);
    });

    it("forces status=published for an anonymous caller, ignoring any status in the query", async () => {
      await createProductsAcrossStatuses();

      const res = await request(app).get("/api/products?status=draft");

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toBe("Published Sofa");
    });

    it("forces status=published for a logged-in customer (not just an anonymous caller)", async () => {
      const customerAgent = await createCustomerAgent();
      await createProductsAcrossStatuses();

      const res = await customerAgent.get("/api/products");

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toBe("Published Sofa");
    });
  });

  describe("GET /api/products/:productId", () => {
    it("lets a logged-in admin fetch a draft product by id", async () => {
      const adminAgent = await createAdminAgent();
      const { draft } = await createProductsAcrossStatuses();

      const res = await adminAgent.get(`/api/products/${draft._id}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("draft");
    });

    it("returns 404 for an anonymous caller fetching a draft product by id", async () => {
      const { draft } = await createProductsAcrossStatuses();

      const res = await request(app).get(`/api/products/${draft._id}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it("returns the product for an anonymous caller when it's published", async () => {
      const { published } = await createProductsAcrossStatuses();

      const res = await request(app).get(`/api/products/${published._id}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("published");
    });
  });
});

describe("GET /api/products — filters (Category/Brand/Material/Color)", () => {
  const setupFilterFixture = async () => {
    const { category, brand, roomType, material, color } = await createMasterData();

    const otherCategory = await Category.create({ name: "Chairs" });
    const otherBrand = await Brand.create({ name: "Other Brand" });
    const otherMaterial = await Material.create({ name: "Teak Wood" });
    const otherColor = await Color.create({ name: "Ivory", hexCode: "#FFFFF0" });

    const base = { roomTypes: [roomType._id], status: "published" };

    const matching = await Product.create({
      ...base,
      name: "Matching Product",
      category: category._id,
      brand: brand._id,
    });
    const nonMatching = await Product.create({
      ...base,
      name: "Non-Matching Product",
      category: otherCategory._id,
      brand: otherBrand._id,
    });

    await ProductVariant.create({
      product: matching._id,
      sku: "MATCH-SKU-0001",
      price: 100000,
      material: material._id,
      color: color._id,
    });
    await ProductVariant.create({
      product: nonMatching._id,
      sku: "NOMATCH-SKU-0001",
      price: 100000,
      material: otherMaterial._id,
      color: otherColor._id,
    });

    return { category, brand, material, color, matching, nonMatching };
  };

  it("filters by category", async () => {
    const { category } = await setupFilterFixture();

    const res = await request(app).get(`/api/products?category=${category._id}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe("Matching Product");
  });

  it("filters by brand", async () => {
    const { brand } = await setupFilterFixture();

    const res = await request(app).get(`/api/products?brand=${brand._id}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe("Matching Product");
  });

  it("filters by material, reaching into the variant it belongs to", async () => {
    const { material } = await setupFilterFixture();

    const res = await request(app).get(`/api/products?material=${material._id}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe("Matching Product");
  });

  it("filters by color, reaching into the variant it belongs to", async () => {
    const { color } = await setupFilterFixture();

    const res = await request(app).get(`/api/products?color=${color._id}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe("Matching Product");
  });

  it("ignores a malformed filter value instead of erroring", async () => {
    await setupFilterFixture();

    const res = await request(app).get("/api/products?category=not-an-object-id");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });

  it("does not match a product whose only variant in that material/color is inactive", async () => {
    const { material, matching } = await setupFilterFixture();

    await ProductVariant.updateOne({ product: matching._id }, { isActive: false });

    const res = await request(app).get(`/api/products?material=${material._id}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });

  it("still applies the ADR-036 status default when a filter is combined with an anonymous request", async () => {
    const { category, matching } = await setupFilterFixture();
    matching.status = "draft";
    await matching.save();

    const res = await request(app).get(`/api/products?category=${category._id}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });

  it("filters by multiple categories at once, comma-separated (ADR-048 multi-select)", async () => {
    const { category, nonMatching } = await setupFilterFixture();

    const res = await request(app).get(
      `/api/products?category=${category._id},${nonMatching.category}`,
    );

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });

  it("filters by roomType (ADR-048)", async () => {
    const { matching } = await setupFilterFixture();
    const { roomTypes } = matching;

    const res = await request(app).get(`/api/products?roomType=${roomTypes[0]}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2); // both fixture products share the same roomType
  });

  it("filters by price range, matching a product with a variant in range (ADR-048)", async () => {
    await setupFilterFixture();

    const res = await request(app).get("/api/products?minPrice=50000&maxPrice=150000");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2); // both fixture variants are priced at 100000
  });

  it("excludes a product whose only variant falls outside the price range (ADR-048)", async () => {
    await setupFilterFixture();

    const res = await request(app).get("/api/products?minPrice=200000");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });

  it("treats an empty price param as no constraint, not as zero (ADR-048)", async () => {
    await setupFilterFixture();

    const res = await request(app).get("/api/products?minPrice=&maxPrice=");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });

  it("combines material and price as independent facets — a product needs a variant matching each, not necessarily the same one (ADR-048)", async () => {
    const { matching, material } = await setupFilterFixture();

    // Give "matching" a second variant, in the same material but a
    // different color, priced outside the range — proves the price
    // constraint isn't required to land on the *same* variant that
    // satisfied the material constraint.
    const extraColor = await Color.create({ name: "Extra Color", hexCode: "#123456" });
    await ProductVariant.create({
      product: matching._id,
      sku: "MATCH-SKU-0002",
      price: 999999,
      material,
      color: extraColor._id,
    });

    const res = await request(app).get(
      `/api/products?material=${material._id}&minPrice=50000&maxPrice=150000`,
    );

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe("Matching Product");
  });
});

describe("GET /api/products/filter-options", () => {
  it("returns every active Category/Brand/RoomType/Material/Color with a real, published-only product count", async () => {
    const { category, brand, roomType, material, color } = await createMasterData();
    const draftOnlyCategory = await Category.create({ name: "Draft-Only Category" });

    const published = await Product.create({
      name: "Published Product",
      category: category._id,
      brand: brand._id,
      roomTypes: [roomType._id],
      status: "published",
    });
    await ProductVariant.create({
      product: published._id,
      sku: "PUB-SKU-0001",
      price: 100000,
      material: material._id,
      color: color._id,
    });

    // A draft product referencing a different category must NOT count —
    // filter-options counts are published-only.
    await Product.create({
      name: "Draft Product",
      category: draftOnlyCategory._id,
      brand: brand._id,
      roomTypes: [roomType._id],
      status: "draft",
    });

    const res = await request(app).get("/api/products/filter-options");

    expect(res.status).toBe(200);

    const categoryRow = res.body.data.categories.find(
      (c) => c._id === category._id.toString(),
    );
    const draftCategoryRow = res.body.data.categories.find(
      (c) => c._id === draftOnlyCategory._id.toString(),
    );
    const brandRow = res.body.data.brands.find((b) => b._id === brand._id.toString());
    const roomTypeRow = res.body.data.roomTypes.find(
      (r) => r._id === roomType._id.toString(),
    );
    const materialRow = res.body.data.materials.find(
      (m) => m._id === material._id.toString(),
    );
    const colorRow = res.body.data.colors.find((c) => c._id === color._id.toString());

    expect(categoryRow.count).toBe(1);
    expect(draftCategoryRow.count).toBe(0);
    expect(brandRow.count).toBe(1);
    expect(roomTypeRow.count).toBe(1);
    expect(materialRow.count).toBe(1);
    expect(colorRow.count).toBe(1);
  });

  it("does not require authentication", async () => {
    const res = await request(app).get("/api/products/filter-options");

    expect(res.status).toBe(200);
  });
});
