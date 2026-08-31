import request from "supertest";
import mongoose from "mongoose";
import app from "../src/app.js";
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

describe("Wishlist auth (ADR-037)", () => {
  it("rejects an anonymous caller with 401", async () => {
    const res = await request(app).get("/api/wishlist");
    expect(res.status).toBe(401);
  });

  it("rejects a logged-in admin with 403 — wishlist is Customer-only", async () => {
    const adminAgent = await createAdminAgent();
    const res = await adminAgent.get("/api/wishlist");
    expect(res.status).toBe(403);
  });
});

describe("GET /api/wishlist", () => {
  it("returns an empty wishlist when none exists yet", async () => {
    const customerAgent = await createCustomerAgent();

    const res = await customerAgent.get("/api/wishlist");

    expect(res.status).toBe(200);
    expect(res.body.data.products).toEqual([]);
  });
});

describe("POST /api/wishlist/items", () => {
  it("adds a product to the wishlist", async () => {
    const customerAgent = await createCustomerAgent();
    const { category, brand, roomType } = await createMasterData();
    const product = await createTestProduct({ category, brand, roomType });

    const res = await customerAgent
      .post("/api/wishlist/items")
      .send({ product: product._id.toString() });

    expect(res.status).toBe(200);
    expect(res.body.data.products).toHaveLength(1);
    expect(res.body.data.products[0]._id).toBe(product._id.toString());
  });

  it("is a no-op, not a duplicate, when the same product is wishlisted again", async () => {
    const customerAgent = await createCustomerAgent();
    const { category, brand, roomType } = await createMasterData();
    const product = await createTestProduct({ category, brand, roomType });

    await customerAgent
      .post("/api/wishlist/items")
      .send({ product: product._id.toString() });
    const res = await customerAgent
      .post("/api/wishlist/items")
      .send({ product: product._id.toString() });

    expect(res.status).toBe(200);
    expect(res.body.data.products).toHaveLength(1);
  });

  it("returns 404 for a product that doesn't exist", async () => {
    const customerAgent = await createCustomerAgent();
    const fakeId = new mongoose.Types.ObjectId().toString();

    const res = await customerAgent
      .post("/api/wishlist/items")
      .send({ product: fakeId });

    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/wishlist/items/:productId", () => {
  it("removes a product from the wishlist", async () => {
    const customerAgent = await createCustomerAgent();
    const { category, brand, roomType } = await createMasterData();
    const product = await createTestProduct({ category, brand, roomType });

    await customerAgent
      .post("/api/wishlist/items")
      .send({ product: product._id.toString() });
    const res = await customerAgent.delete(`/api/wishlist/items/${product._id}`);

    expect(res.status).toBe(200);
    expect(res.body.data.products).toHaveLength(0);
  });

  it("is a no-op when removing a product that isn't wishlisted", async () => {
    const customerAgent = await createCustomerAgent();
    const { category, brand, roomType } = await createMasterData();
    const product = await createTestProduct({ category, brand, roomType });

    const res = await customerAgent.delete(`/api/wishlist/items/${product._id}`);

    expect(res.status).toBe(200);
    expect(res.body.data.products).toHaveLength(0);
  });
});
