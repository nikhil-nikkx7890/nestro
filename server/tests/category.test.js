import request from "supertest";
import mongoose from "mongoose";
import app from "../src/app.js";
import Category from "../src/models/category.model.js";
import { connectTestDB, clearTestDB, disconnectTestDB } from "./setup/testDb.js";
import { createMasterData, createTestProduct } from "./fixtures/masterData.js";
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

describe("POST /api/categories", () => {
  it("creates a category when the payload is valid and the caller is an admin", async () => {
    const adminAgent = await createAdminAgent();

    const res = await adminAgent.post("/api/categories").send({ name: "Sofas", isActive: true });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe("Sofas");
    expect(res.body.data.slug).toBe("sofas");
  });

  it("rejects a duplicate category name (case-insensitive)", async () => {
    const adminAgent = await createAdminAgent();
    await Category.create({ name: "Sofas" });

    const res = await adminAgent.post("/api/categories").send({ name: "sofas", isActive: true });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it("rejects the request when no one is logged in (ADR-035)", async () => {
    const res = await request(app).post("/api/categories").send({ name: "Sofas" });

    expect(res.status).toBe(401);
  });

  it("rejects the request when the caller is logged in but not an admin (ADR-035)", async () => {
    const customerAgent = await createCustomerAgent();

    const res = await customerAgent.post("/api/categories").send({ name: "Sofas" });

    expect(res.status).toBe(403);
  });
});

describe("GET /api/categories/:categoryId", () => {
  it("returns 404 when the category doesn't exist", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();

    const res = await request(app).get(`/api/categories/${fakeId}`);

    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/categories/:categoryId", () => {
  it("blocks deleting a category that a product still references (ADR-024)", async () => {
    const adminAgent = await createAdminAgent();
    const masterData = await createMasterData();
    await createTestProduct(masterData);

    const res = await adminAgent.delete(`/api/categories/${masterData.category._id}`);

    expect(res.status).toBe(409);
    expect(await Category.findById(masterData.category._id)).not.toBeNull();
  });

  it("deletes a category that nothing references", async () => {
    const adminAgent = await createAdminAgent();
    const category = await Category.create({ name: "Unused Category" });

    const res = await adminAgent.delete(`/api/categories/${category._id}`);

    expect(res.status).toBe(200);
    expect(await Category.findById(category._id)).toBeNull();
  });
});
