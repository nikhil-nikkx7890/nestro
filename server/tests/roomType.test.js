import request from "supertest";
import mongoose from "mongoose";
import app from "../src/app.js";
import RoomType from "../src/models/roomType.model.js";
import { connectTestDB, clearTestDB, disconnectTestDB } from "./setup/testDb.js";
import { createMasterData, createTestProduct } from "./fixtures/masterData.js";
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

describe("POST /api/room-types", () => {
  it("creates a room type when the payload is valid", async () => {
    const adminAgent = await createAdminAgent();

    const res = await adminAgent
      .post("/api/room-types")
      .send({ name: "Living Room", isActive: true });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe("Living Room");
    expect(res.body.data.slug).toBe("living-room");
  });

  it("rejects a duplicate room type name (case-insensitive)", async () => {
    const adminAgent = await createAdminAgent();
    await RoomType.create({ name: "Living Room" });

    const res = await adminAgent
      .post("/api/room-types")
      .send({ name: "living room", isActive: true });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it("rejects the request when no one is logged in (ADR-035)", async () => {
    const res = await request(app).post("/api/room-types").send({ name: "Living Room" });

    expect(res.status).toBe(401);
  });
});

describe("GET /api/room-types/:roomTypeId", () => {
  it("returns 404 when the room type doesn't exist", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();

    const res = await request(app).get(`/api/room-types/${fakeId}`);

    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/room-types/:roomTypeId", () => {
  it("blocks deleting a room type that a product still references (ADR-024)", async () => {
    const adminAgent = await createAdminAgent();
    const masterData = await createMasterData();
    await createTestProduct(masterData);

    const res = await adminAgent.delete(`/api/room-types/${masterData.roomType._id}`);

    expect(res.status).toBe(409);
    expect(await RoomType.findById(masterData.roomType._id)).not.toBeNull();
  });

  it("deletes a room type that nothing references", async () => {
    const adminAgent = await createAdminAgent();
    const roomType = await RoomType.create({ name: "Unused Room" });

    const res = await adminAgent.delete(`/api/room-types/${roomType._id}`);

    expect(res.status).toBe(200);
    expect(await RoomType.findById(roomType._id)).toBeNull();
  });
});
