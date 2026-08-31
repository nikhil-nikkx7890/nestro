import request from "supertest";
import mongoose from "mongoose";
import app from "../src/app.js";
import Product from "../src/models/product.model.js";
import ProductVariant from "../src/models/productVariant.model.js";
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
