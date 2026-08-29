import request from "supertest";
import mongoose from "mongoose";
import app from "../src/app.js";
import Color from "../src/models/color.model.js";
import { connectTestDB, clearTestDB, disconnectTestDB } from "./setup/testDb.js";
import { createMasterData, createTestProduct, createTestVariant } from "./fixtures/masterData.js";

beforeAll(async () => {
  await connectTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

describe("POST /api/colors", () => {
  it("creates a color when the payload is valid", async () => {
    const res = await request(app)
      .post("/api/colors")
      .send({ name: "Walnut Brown", hexCode: "#8B5E3C", isActive: true });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe("Walnut Brown");
    expect(res.body.data.hexCode).toBe("#8B5E3C");
    expect(res.body.data.slug).toBe("walnut-brown");
  });

  it("rejects a duplicate color name (case-insensitive)", async () => {
    await Color.create({ name: "Walnut Brown", hexCode: "#8B5E3C" });

    const res = await request(app)
      .post("/api/colors")
      .send({ name: "walnut brown", hexCode: "#8B5E3C", isActive: true });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });
});

describe("GET /api/colors/:colorId", () => {
  it("returns 404 when the color doesn't exist", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();

    const res = await request(app).get(`/api/colors/${fakeId}`);

    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/colors/:colorId", () => {
  it("blocks deleting a color that a variant still references (ADR-024)", async () => {
    // Color is referenced by ProductVariant, not Product directly —
    // so unlike Category/Brand/RoomType, we need a Product AND a Variant on it.
    const masterData = await createMasterData();
    const product = await createTestProduct(masterData);
    await createTestVariant(product, masterData);

    const res = await request(app).delete(`/api/colors/${masterData.color._id}`);

    expect(res.status).toBe(409);
    expect(await Color.findById(masterData.color._id)).not.toBeNull();
  });

  it("deletes a color that nothing references", async () => {
    const color = await Color.create({ name: "Unused Color", hexCode: "#123456" });

    const res = await request(app).delete(`/api/colors/${color._id}`);

    expect(res.status).toBe(200);
    expect(await Color.findById(color._id)).toBeNull();
  });
});
