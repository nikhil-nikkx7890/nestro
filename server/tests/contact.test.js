import request from "supertest";
import app from "../src/app.js";
import ContactSubmission from "../src/models/contact.model.js";
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

const validSubmission = {
  name: "Priya Rao",
  email: "priya@example.com",
  message: "Do you deliver to Mumbai within two weeks?",
};

describe("POST /api/contact", () => {
  it("stores a valid submission without requiring login", async () => {
    const res = await request(app).post("/api/contact").send(validSubmission);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    const inDb = await ContactSubmission.findOne({ email: validSubmission.email });
    expect(inDb).not.toBeNull();
    expect(inDb.message).toBe(validSubmission.message);
  });

  it("rejects a submission missing a required field", async () => {
    const res = await request(app)
      .post("/api/contact")
      .send({ name: "Priya Rao", email: "priya@example.com" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(await ContactSubmission.countDocuments()).toBe(0);
  });

  it("rejects an invalid email address", async () => {
    const res = await request(app)
      .post("/api/contact")
      .send({ ...validSubmission, email: "not-an-email" });

    expect(res.status).toBe(400);
  });
});
