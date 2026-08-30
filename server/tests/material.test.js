import request from "supertest";
import mongoose from "mongoose";
import app from "../src/app.js";
import Material from "../src/models/material.model.js";
import { connectTestDB, clearTestDB, disconnectTestDB } from "./setup/testDb.js";
import { createMasterData, createTestProduct, createTestVariant } from "./fixtures/masterData.js";
import { createAdminAgent } from "./fixtures/auth.js";

beforeAll(async () => {
  await connectTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

describe("POST /api/materials", () => {
  it("creates a material when the payload is valid", async () => {
    const adminAgent = await createAdminAgent();

    const res = await adminAgent
      .post("/api/materials")
      .send({ name: "Sheesham Wood", isActive: true });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe("Sheesham Wood");
    expect(res.body.data.slug).toBe("sheesham-wood");
  });

  it("rejects a duplicate material name (case-insensitive)", async () => {
    const adminAgent = await createAdminAgent();
    await Material.create({ name: "Sheesham Wood" });

    const res = await adminAgent
      .post("/api/materials")
      .send({ name: "sheesham wood", isActive: true });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it("rejects the request when no one is logged in (ADR-035)", async () => {
    const res = await request(app).post("/api/materials").send({ name: "Sheesham Wood" });

    expect(res.status).toBe(401);
  });
});

describe("GET /api/materials/:materialId", () => {
  it("returns 404 when the material doesn't exist", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();

    const res = await request(app).get(`/api/materials/${fakeId}`);

    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/materials/:materialId", () => {
  it("blocks deleting a material that a variant still references (ADR-024)", async () => {
    const adminAgent = await createAdminAgent();
    const masterData = await createMasterData();
    const product = await createTestProduct(masterData);
    await createTestVariant(product, masterData);

    const res = await adminAgent.delete(`/api/materials/${masterData.material._id}`);

    expect(res.status).toBe(409);
    expect(await Material.findById(masterData.material._id)).not.toBeNull();
  });

  it("deletes a material that nothing references", async () => {
    const adminAgent = await createAdminAgent();
    const material = await Material.create({ name: "Unused Material" });

    const res = await adminAgent.delete(`/api/materials/${material._id}`);

    expect(res.status).toBe(200);
    expect(await Material.findById(material._id)).toBeNull();
  });
});
