import request from "supertest";
import app from "../src/app.js";
import User from "../src/models/user.model.js";
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

const testUser = {
  name: "Nikhil Choudhary",
  email: "nikhil@example.com",
  password: "supersecret123",
};

describe("POST /api/auth/register", () => {
  it("creates a customer account and sets the auth cookie", async () => {
    const res = await request(app).post("/api/auth/register").send(testUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(testUser.email);
    expect(res.body.data.role).toBe("customer"); // never trusts a client-supplied role
    expect(res.body.data.password).toBeUndefined(); // hash must never reach the response
    expect(res.headers["set-cookie"]).toBeDefined();

    const inDb = await User.findOne({ email: testUser.email }).select("+password");
    expect(inDb.password).not.toBe(testUser.password); // stored as a bcrypt hash, not plain text
  });

  it("rejects registering an email that's already in use", async () => {
    await request(app).post("/api/auth/register").send(testUser);

    const res = await request(app).post("/api/auth/register").send(testUser);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });
});

describe("POST /api/auth/login", () => {
  it("logs in with correct credentials and sets the auth cookie", async () => {
    await request(app).post("/api/auth/register").send(testUser);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: testUser.email, password: testUser.password });

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(testUser.email);
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("rejects an incorrect password", async () => {
    await request(app).post("/api/auth/register").send(testUser);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: testUser.email, password: "wrongpassword" });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

describe("GET /api/auth/me", () => {
  it("returns 401 when no auth cookie is sent", async () => {
    const res = await request(app).get("/api/auth/me");

    expect(res.status).toBe(401);
  });

  it("returns the logged-in user's data when the auth cookie is present", async () => {
    // supertest's agent persists cookies across requests in the same
    // agent, the same way a real browser session would — so the cookie
    // set by /login is automatically sent on the /me request below.
    const agent = request.agent(app);

    await agent.post("/api/auth/register").send(testUser);

    const res = await agent.get("/api/auth/me");

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(testUser.email);
  });
});

describe("POST /api/auth/logout", () => {
  it("clears the auth cookie so a subsequent /me request is unauthorized", async () => {
    const agent = request.agent(app);

    await agent.post("/api/auth/register").send(testUser);
    await agent.post("/api/auth/logout");

    const res = await agent.get("/api/auth/me");

    expect(res.status).toBe(401);
  });
});
