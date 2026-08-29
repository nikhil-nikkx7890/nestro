import request from "supertest";
import mongoose from "mongoose";
import app from "../src/app.js";
import Product from "../src/models/product.model.js";
import ProductVariant from "../src/models/productVariant.model.js";
import { connectTestDB, clearTestDB, disconnectTestDB } from "./setup/testDb.js";
import { createMasterData } from "./fixtures/masterData.js";

beforeAll(async () => {
  await connectTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

const createTestProduct = async ({ category, brand, roomType }) =>
  Product.create({
    name: "Test Sofa",
    category: category._id,
    brand: brand._id,
    roomTypes: [roomType._id],
  });

describe("POST /api/products/:productId/variants", () => {
  it("creates a variant with an auto-generated SKU when the payload is valid", async () => {
    const masterData = await createMasterData();
    const product = await createTestProduct(masterData);

    const res = await request(app)
      .post(`/api/products/${product._id}/variants`)
      .send({
        price: 149999,
        material: masterData.material._id.toString(),
        color: masterData.color._id.toString(),
        stock: 10,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    // sku is server-generated (ADR-031) — the client never sends it
    expect(res.body.data.sku).toEqual(expect.any(String));
    expect(res.body.data.sku.length).toBeGreaterThan(0);
    expect(res.body.data.material.name).toBe("Sheesham Wood");
  });

  it("returns 404 when the parent product doesn't exist", async () => {
    const { material, color } = await createMasterData();
    const fakeProductId = new mongoose.Types.ObjectId().toString();

    const res = await request(app)
      .post(`/api/products/${fakeProductId}/variants`)
      .send({
        price: 149999,
        material: material._id.toString(),
        color: color._id.toString(),
      });

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/Product not found/i);
  });

  it("returns 409 when a variant with the same material+color already exists for the product", async () => {
    const masterData = await createMasterData();
    const product = await createTestProduct(masterData);

    const payload = {
      price: 149999,
      material: masterData.material._id.toString(),
      color: masterData.color._id.toString(),
    };

    const first = await request(app)
      .post(`/api/products/${product._id}/variants`)
      .send(payload);
    expect(first.status).toBe(201);

    const duplicate = await request(app)
      .post(`/api/products/${product._id}/variants`)
      .send(payload);

    expect(duplicate.status).toBe(409);
    expect(duplicate.body.success).toBe(false);
  });
});

describe("GET /api/variants/:variantId", () => {
  it("returns the variant when it exists", async () => {
    const masterData = await createMasterData();
    const product = await createTestProduct(masterData);
    const variant = await ProductVariant.create({
      product: product._id,
      sku: "TEST-SKU-0001",
      price: 100000,
      material: masterData.material._id,
      color: masterData.color._id,
    });

    const res = await request(app).get(`/api/variants/${variant._id}`);

    expect(res.status).toBe(200);
    expect(res.body.data.sku).toBe("TEST-SKU-0001");
  });

  it("returns 404 when the variant doesn't exist", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();

    const res = await request(app).get(`/api/variants/${fakeId}`);

    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/variants/:variantId", () => {
  it("deletes an existing variant", async () => {
    const masterData = await createMasterData();
    const product = await createTestProduct(masterData);
    const variant = await ProductVariant.create({
      product: product._id,
      sku: "TEST-SKU-0001",
      price: 100000,
      material: masterData.material._id,
      color: masterData.color._id,
    });

    const res = await request(app).delete(`/api/variants/${variant._id}`);

    expect(res.status).toBe(200);
    expect(await ProductVariant.findById(variant._id)).toBeNull();
  });

  it("returns 404 when deleting a variant that doesn't exist", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();

    const res = await request(app).delete(`/api/variants/${fakeId}`);

    expect(res.status).toBe(404);
  });
});
