import request from "supertest";
import app from "../src/app.js";
import User from "../src/models/user.model.js";
import { connectTestDB, clearTestDB, disconnectTestDB } from "./setup/testDb.js";
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

const createUser = (overrides = {}) =>
  User.create({
    name: "Extra Person",
    email: "extra@test.com",
    password: "testpassword123",
    role: "customer",
    ...overrides,
  });

describe("GET /api/users", () => {
  it("returns every user to an admin", async () => {
    await createUser();
    const admin = await createAdminAgent();

    const res = await admin.get("/api/users");

    expect(res.status).toBe(200);
    // The admin fixture's own account plus the one created above.
    expect(res.body.pagination.total).toBe(2);
  });

  it("never returns password hashes", async () => {
    await createUser();
    const admin = await createAdminAgent();

    const res = await admin.get("/api/users");

    for (const user of res.body.data) {
      expect(user.password).toBeUndefined();
    }
  });

  it("rejects a customer (admin-only)", async () => {
    const customer = await createCustomerAgent();

    const res = await customer.get("/api/users");

    expect(res.status).toBe(403);
  });

  it("rejects the request when no one is logged in", async () => {
    const res = await request(app).get("/api/users");

    expect(res.status).toBe(401);
  });

  it("filters by role", async () => {
    await createUser();
    const admin = await createAdminAgent();

    const res = await admin.get("/api/users?role=admin");

    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].role).toBe("admin");
  });
});

describe("PATCH /api/users/:userId/status", () => {
  it("deactivates another user", async () => {
    const target = await createUser();
    const admin = await createAdminAgent();

    const res = await admin
      .patch(`/api/users/${target._id}/status`)
      .send({ isActive: false });

    expect(res.status).toBe(200);
    expect((await User.findById(target._id)).isActive).toBe(false);
  });

  it("makes the deactivated user's very next request fail", async () => {
    // The point of deactivation: authenticate re-reads the user on every
    // request (ADR-034), so it takes effect immediately rather than
    // waiting out the 7-day token.
    const customer = await createCustomerAgent();
    const target = await User.findOne({ email: "customer@test.com" });

    const beforeRes = await customer.get("/api/cart");
    expect(beforeRes.status).toBe(200);

    const admin = await createAdminAgent();
    await admin.patch(`/api/users/${target._id}/status`).send({ isActive: false });

    const afterRes = await customer.get("/api/cart");
    expect(afterRes.status).toBe(403);
  });

  it("refuses to let an admin change their own status", async () => {
    const admin = await createAdminAgent();
    const self = await User.findOne({ email: "admin@test.com" });

    const res = await admin
      .patch(`/api/users/${self._id}/status`)
      .send({ isActive: false });

    expect(res.status).toBe(400);
    expect((await User.findById(self._id)).isActive).toBe(true);
  });

  it("refuses to deactivate the last active admin", async () => {
    const otherAdmin = await createUser({
      name: "Second Admin",
      email: "second-admin@test.com",
      role: "admin",
    });
    const admin = await createAdminAgent();

    // Two admins exist, so deactivating one is allowed...
    const first = await admin
      .patch(`/api/users/${otherAdmin._id}/status`)
      .send({ isActive: false });
    expect(first.status).toBe(200);

    // ...and now the fixture admin is the only active one left. It can't
    // deactivate itself (previous test), so create a third admin to try
    // deactivating it from.
    const thirdAdmin = await createUser({
      name: "Third Admin",
      email: "third-admin@test.com",
      role: "admin",
    });
    const self = await User.findOne({ email: "admin@test.com" });
    await admin.patch(`/api/users/${thirdAdmin._id}/status`).send({ isActive: false });

    const res = await admin
      .patch(`/api/users/${self._id}/status`)
      .send({ isActive: false });

    // Blocked either way — self-change is refused first, and the
    // last-admin guard would refuse it too.
    expect(res.status).toBe(400);
    expect(await User.countDocuments({ role: "admin", isActive: true })).toBe(1);
  });

  it("rejects a payload carrying anything other than isActive", async () => {
    const target = await createUser();
    const admin = await createAdminAgent();

    // Role changes are Super Admin territory and deliberately unsupported.
    const res = await admin
      .patch(`/api/users/${target._id}/status`)
      .send({ isActive: true, role: "admin" });

    expect(res.status).toBe(400);
    expect((await User.findById(target._id)).role).toBe("customer");
  });

  it("rejects a customer trying to deactivate someone", async () => {
    const target = await createUser({ email: "target@test.com" });
    const customer = await createCustomerAgent();

    const res = await customer
      .patch(`/api/users/${target._id}/status`)
      .send({ isActive: false });

    expect(res.status).toBe(403);
  });
});
