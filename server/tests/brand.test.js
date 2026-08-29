import request from "supertest";
import mongoose from "mongoose";
import app from "../src/app.js";
import Brand from "../src/models/brand.model.js";
import { connectTestDB, clearTestDB, disconnectTestDB } from "./setup/testDb.js";
import { createMasterData, createTestProduct } from "./fixtures/masterData.js";

beforeAll(async () => {
  await connectTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

describe("POST /api/brands", () => {
  it("creates a brand when the payload is valid", async () => {
    const res = await request(app)
      .post("/api/brands")
      .send({ name: "Nestro Home", isActive: true });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe("Nestro Home");
    expect(res.body.data.slug).toBe("nestro-home");
  });

  it("rejects a duplicate brand name (case-insensitive)", async () => {
    await Brand.create({ name: "Nestro Home" });

    const res = await request(app)
      .post("/api/brands")
      .send({ name: "nestro home", isActive: true });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });
});

describe("GET /api/brands/:brandId", () => {
  it("returns 404 when the brand doesn't exist", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();

    const res = await request(app).get(`/api/brands/${fakeId}`);

    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/brands/:brandId", () => {
  it("blocks deleting a brand that a product still references (ADR-024)", async () => {
    const masterData = await createMasterData();
    await createTestProduct(masterData);

    const res = await request(app).delete(`/api/brands/${masterData.brand._id}`);

    expect(res.status).toBe(409);
    expect(await Brand.findById(masterData.brand._id)).not.toBeNull();
  });

  it("deletes a brand that nothing references", async () => {
    const brand = await Brand.create({ name: "Unused Brand" });

    const res = await request(app).delete(`/api/brands/${brand._id}`);

    expect(res.status).toBe(200);
    expect(await Brand.findById(brand._id)).toBeNull();
  });
});
