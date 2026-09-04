import request from "supertest";
import app from "../src/app.js";
import NewsletterSubscriber from "../src/models/newsletter.model.js";
import { connectTestDB, clearTestDB, disconnectTestDB } from "./setup/testDb.js";

beforeAll(async () => {
  await connectTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

describe("POST /api/newsletter", () => {
  it("stores a subscription without requiring login", async () => {
    const res = await request(app)
      .post("/api/newsletter")
      .send({ email: "reader@example.com" });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    const inDb = await NewsletterSubscriber.findOne({ email: "reader@example.com" });
    expect(inDb).not.toBeNull();
  });

  it("rejects an invalid email address", async () => {
    const res = await request(app).post("/api/newsletter").send({ email: "not-an-email" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("treats a repeat subscription as a success, without creating a duplicate", async () => {
    await request(app).post("/api/newsletter").send({ email: "reader@example.com" });
    const res = await request(app)
      .post("/api/newsletter")
      .send({ email: "reader@example.com" });

    expect(res.status).toBe(201);
    expect(await NewsletterSubscriber.countDocuments({ email: "reader@example.com" })).toBe(1);
  });
});
