import request from "supertest";
import mongoose from "mongoose";
import app from "../src/app.js";
import ProductVariant from "../src/models/productVariant.model.js";
import { connectTestDB, clearTestDB, disconnectTestDB } from "./setup/testDb.js";
import { createMasterData, createTestProduct } from "./fixtures/masterData.js";
import { createCustomerAgent, createAdminAgent } from "./fixtures/auth.js";

beforeAll(async () => {
  await connectTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

const createVariant = async (product, { material, color }, overrides = {}) =>
  ProductVariant.create({
    product: product._id,
    sku: overrides.sku || "CART-TEST-SKU-0001",
    price: 100000,
    material: material._id,
    color: color._id,
    stock: 10,
    ...overrides,
  });

describe("Cart auth (ADR-037)", () => {
  it("rejects an anonymous caller with 401", async () => {
    const res = await request(app).get("/api/cart");
    expect(res.status).toBe(401);
  });

  it("rejects a logged-in admin with 403 — cart is Customer-only", async () => {
    const adminAgent = await createAdminAgent();
    const res = await adminAgent.get("/api/cart");
    expect(res.status).toBe(403);
  });
});

describe("GET /api/cart", () => {
  it("returns an empty cart when none exists yet", async () => {
    const customerAgent = await createCustomerAgent();

    const res = await customerAgent.get("/api/cart");

    expect(res.status).toBe(200);
    expect(res.body.data.items).toEqual([]);
    expect(res.body.data.subtotal).toBe(0);
    expect(res.body.data.itemCount).toBe(0);
  });
});

describe("POST /api/cart/items", () => {
  it("adds a variant to the cart", async () => {
    const customerAgent = await createCustomerAgent();
    const { category, brand, roomType, material, color } = await createMasterData();
    const product = await createTestProduct({ category, brand, roomType });
    const variant = await createVariant(product, { material, color });

    const res = await customerAgent
      .post("/api/cart/items")
      .send({ variant: variant._id.toString(), quantity: 2 });

    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].quantity).toBe(2);
    expect(res.body.data.subtotal).toBe(200000);
    expect(res.body.data.itemCount).toBe(2);
  });

  it("increments quantity instead of duplicating when the same variant is added again", async () => {
    const customerAgent = await createCustomerAgent();
    const { category, brand, roomType, material, color } = await createMasterData();
    const product = await createTestProduct({ category, brand, roomType });
    const variant = await createVariant(product, { material, color });

    await customerAgent
      .post("/api/cart/items")
      .send({ variant: variant._id.toString(), quantity: 2 });
    const res = await customerAgent
      .post("/api/cart/items")
      .send({ variant: variant._id.toString(), quantity: 3 });

    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].quantity).toBe(5);
  });

  it("rejects a quantity greater than available stock", async () => {
    const customerAgent = await createCustomerAgent();
    const { category, brand, roomType, material, color } = await createMasterData();
    const product = await createTestProduct({ category, brand, roomType });
    const variant = await createVariant(product, { material, color }, { stock: 3 });

    const res = await customerAgent
      .post("/api/cart/items")
      .send({ variant: variant._id.toString(), quantity: 5 });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/in stock/i);
  });

  it("rejects an inactive variant", async () => {
    const customerAgent = await createCustomerAgent();
    const { category, brand, roomType, material, color } = await createMasterData();
    const product = await createTestProduct({ category, brand, roomType });
    const variant = await createVariant(product, { material, color }, { isActive: false });

    const res = await customerAgent
      .post("/api/cart/items")
      .send({ variant: variant._id.toString(), quantity: 1 });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/no longer available/i);
  });

  it("returns 404 for a variant that doesn't exist", async () => {
    const customerAgent = await createCustomerAgent();
    const fakeId = new mongoose.Types.ObjectId().toString();

    const res = await customerAgent
      .post("/api/cart/items")
      .send({ variant: fakeId, quantity: 1 });

    expect(res.status).toBe(404);
  });
});

describe("PUT /api/cart/items/:variantId", () => {
  it("updates the quantity of an existing cart item", async () => {
    const customerAgent = await createCustomerAgent();
    const { category, brand, roomType, material, color } = await createMasterData();
    const product = await createTestProduct({ category, brand, roomType });
    const variant = await createVariant(product, { material, color });

    await customerAgent
      .post("/api/cart/items")
      .send({ variant: variant._id.toString(), quantity: 1 });
    const res = await customerAgent
      .put(`/api/cart/items/${variant._id}`)
      .send({ quantity: 4 });

    expect(res.status).toBe(200);
    expect(res.body.data.items[0].quantity).toBe(4);
  });

  it("returns 404 when updating an item not in the cart", async () => {
    const customerAgent = await createCustomerAgent();
    const { category, brand, roomType, material, color } = await createMasterData();
    const product = await createTestProduct({ category, brand, roomType });
    const variant = await createVariant(product, { material, color });

    const res = await customerAgent
      .put(`/api/cart/items/${variant._id}`)
      .send({ quantity: 2 });

    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/cart/items/:variantId", () => {
  it("removes an item from the cart", async () => {
    const customerAgent = await createCustomerAgent();
    const { category, brand, roomType, material, color } = await createMasterData();
    const product = await createTestProduct({ category, brand, roomType });
    const variant = await createVariant(product, { material, color });

    await customerAgent
      .post("/api/cart/items")
      .send({ variant: variant._id.toString(), quantity: 1 });
    const res = await customerAgent.delete(`/api/cart/items/${variant._id}`);

    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(0);
  });

  it("returns 404 when removing an item not in the cart", async () => {
    const customerAgent = await createCustomerAgent();
    const { category, brand, roomType, material, color } = await createMasterData();
    const product = await createTestProduct({ category, brand, roomType });
    const variant = await createVariant(product, { material, color });

    const res = await customerAgent.delete(`/api/cart/items/${variant._id}`);

    expect(res.status).toBe(404);
  });
});
