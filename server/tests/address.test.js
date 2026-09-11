import request from "supertest";
import app from "../src/app.js";
import Address from "../src/models/address.model.js";
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

const validAddress = {
  fullName: "Nikhil Choudhary",
  phone: "9876543210",
  addressLine: "221B Baker Colony, Sector 12",
  city: "Jaipur",
  state: "Rajasthan",
  pincode: "302012",
};

describe("Address auth (ADR-065)", () => {
  it("rejects an anonymous caller with 401", async () => {
    const res = await request(app).get("/api/addresses");
    expect(res.status).toBe(401);
  });

  it("rejects a logged-in admin with 403 — addresses are Customer-only", async () => {
    const admin = await createAdminAgent();
    const res = await admin.get("/api/addresses");
    expect(res.status).toBe(403);
  });
});

describe("GET /api/addresses", () => {
  it("returns an empty list when none exist yet", async () => {
    const customer = await createCustomerAgent();

    const res = await customer.get("/api/addresses");

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it("lists default first, then most-recently-created", async () => {
    const customer = await createCustomerAgent();

    const first = await customer.post("/api/addresses").send(validAddress);
    const second = await customer
      .post("/api/addresses")
      .send({ ...validAddress, addressLine: "Second address line here" });
    // Make the third the default explicitly.
    const third = await customer
      .post("/api/addresses")
      .send({ ...validAddress, addressLine: "Third address line here", isDefault: true });

    const res = await customer.get("/api/addresses");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(3);
    // Default (third) first, then most recent of the rest (second), then first.
    expect(res.body.data[0]._id).toBe(third.body.data._id);
    expect(res.body.data[0].isDefault).toBe(true);
    expect(res.body.data[1]._id).toBe(second.body.data._id);
    expect(res.body.data[2]._id).toBe(first.body.data._id);
  });

  it("never returns another customer's addresses", async () => {
    const owner = await User.create({
      name: "Owner",
      email: "owner@test.com",
      password: "testpassword123",
      role: "customer",
    });
    await Address.create({ ...validAddress, user: owner._id, isDefault: true });

    const customer = await createCustomerAgent();
    const res = await customer.get("/api/addresses");

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });
});

describe("POST /api/addresses", () => {
  it("creates an address and defaults country/addressType/landmark", async () => {
    const customer = await createCustomerAgent();

    const res = await customer.post("/api/addresses").send(validAddress);

    expect(res.status).toBe(201);
    expect(res.body.data.country).toBe("India");
    expect(res.body.data.addressType).toBe("Home");
    expect(res.body.data.landmark).toBe("");
  });

  // ADR-065: a user's first address is always the default — forced
  // server-side, regardless of what the client sends.
  it("forces the first address to be the default, even if isDefault is false", async () => {
    const customer = await createCustomerAgent();

    const res = await customer
      .post("/api/addresses")
      .send({ ...validAddress, isDefault: false });

    expect(res.status).toBe(201);
    expect(res.body.data.isDefault).toBe(true);
  });

  it("a second address without isDefault stays non-default, first stays default", async () => {
    const customer = await createCustomerAgent();
    const first = await customer.post("/api/addresses").send(validAddress);

    const second = await customer
      .post("/api/addresses")
      .send({ ...validAddress, addressLine: "A different address line" });

    expect(second.body.data.isDefault).toBe(false);

    const inDb = await Address.findById(first.body.data._id);
    expect(inDb.isDefault).toBe(true);
  });

  // Only one default at a time (ADR-065) — explicitly requesting default
  // on a later address must unset the previous one.
  it("unsets the previous default when a new address is created as default", async () => {
    const customer = await createCustomerAgent();
    const first = await customer.post("/api/addresses").send(validAddress);

    const second = await customer
      .post("/api/addresses")
      .send({ ...validAddress, addressLine: "A different address line", isDefault: true });

    expect(second.body.data.isDefault).toBe(true);

    const firstInDb = await Address.findById(first.body.data._id);
    expect(firstInDb.isDefault).toBe(false);

    const defaultCount = await Address.countDocuments({
      user: firstInDb.user,
      isDefault: true,
    });
    expect(defaultCount).toBe(1);
  });

  it("rejects a payload missing required fields", async () => {
    const customer = await createCustomerAgent();

    const res = await customer.post("/api/addresses").send({ fullName: "Only A Name" });

    expect(res.status).toBe(400);
  });

  it("rejects an invalid phone number", async () => {
    const customer = await createCustomerAgent();

    const res = await customer
      .post("/api/addresses")
      .send({ ...validAddress, phone: "12345" });

    expect(res.status).toBe(400);
  });

  it("rejects an invalid pincode", async () => {
    const customer = await createCustomerAgent();

    const res = await customer
      .post("/api/addresses")
      .send({ ...validAddress, pincode: "ABCDEF" });

    expect(res.status).toBe(400);
  });

  it("rejects an unknown field (.strict())", async () => {
    const customer = await createCustomerAgent();

    const res = await customer
      .post("/api/addresses")
      .send({ ...validAddress, notAField: "nope" });

    expect(res.status).toBe(400);
  });
});

describe("PATCH /api/addresses/:id", () => {
  it("updates fields that don't touch isDefault", async () => {
    const customer = await createCustomerAgent();
    const created = await customer.post("/api/addresses").send(validAddress);

    const res = await customer
      .patch(`/api/addresses/${created.body.data._id}`)
      .send({ city: "Udaipur", addressType: "Office" });

    expect(res.status).toBe(200);
    expect(res.body.data.city).toBe("Udaipur");
    expect(res.body.data.addressType).toBe("Office");
    expect(res.body.data.isDefault).toBe(true); // untouched — was the (only) default
  });

  it("does not reset omitted fields to their create-time defaults", async () => {
    const customer = await createCustomerAgent();
    const created = await customer
      .post("/api/addresses")
      .send({ ...validAddress, landmark: "Near the water tower" });

    const res = await customer
      .patch(`/api/addresses/${created.body.data._id}`)
      .send({ city: "Udaipur" });

    expect(res.status).toBe(200);
    expect(res.body.data.landmark).toBe("Near the water tower"); // not reset to ""
    expect(res.body.data.country).toBe("India"); // not touched either
  });

  it("makes a non-default address the default, unsetting the previous one", async () => {
    const customer = await createCustomerAgent();
    const first = await customer.post("/api/addresses").send(validAddress);
    const second = await customer
      .post("/api/addresses")
      .send({ ...validAddress, addressLine: "A different address line" });

    const res = await customer
      .patch(`/api/addresses/${second.body.data._id}`)
      .send({ isDefault: true });

    expect(res.status).toBe(200);
    expect(res.body.data.isDefault).toBe(true);

    const firstInDb = await Address.findById(first.body.data._id);
    expect(firstInDb.isDefault).toBe(false);
  });

  // isDefault: false is a no-op (see the controller's own comment) —
  // there is no "unset default in place" action, only "set a different
  // one as default instead."
  it("ignores an attempt to unset the current default via isDefault: false", async () => {
    const customer = await createCustomerAgent();
    const created = await customer.post("/api/addresses").send(validAddress);

    const res = await customer
      .patch(`/api/addresses/${created.body.data._id}`)
      .send({ isDefault: false });

    expect(res.status).toBe(200);
    expect(res.body.data.isDefault).toBe(true); // still the default
  });

  it("returns 404 for an address that doesn't exist", async () => {
    const customer = await createCustomerAgent();

    const res = await customer
      .patch("/api/addresses/64b000000000000000000000")
      .send({ city: "Udaipur" });

    expect(res.status).toBe(404);
  });

  // Same 404 as "doesn't exist" — see the controller's own comment on
  // why this isn't a 403 the way updateReview's ownership check is.
  it("returns 404, not the other customer's data, for someone else's address", async () => {
    const owner = await User.create({
      name: "Owner",
      email: "owner@test.com",
      password: "testpassword123",
      role: "customer",
    });
    const ownerAddress = await Address.create({
      ...validAddress,
      user: owner._id,
      isDefault: true,
    });

    const customer = await createCustomerAgent();
    const res = await customer
      .patch(`/api/addresses/${ownerAddress._id}`)
      .send({ city: "Somewhere Else" });

    expect(res.status).toBe(404);

    const stillIntact = await Address.findById(ownerAddress._id);
    expect(stillIntact.city).toBe(validAddress.city);
  });

  it("rejects an empty update body", async () => {
    const customer = await createCustomerAgent();
    const created = await customer.post("/api/addresses").send(validAddress);

    const res = await customer.patch(`/api/addresses/${created.body.data._id}`).send({});

    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/addresses/:id", () => {
  it("deletes a non-default address without touching the default", async () => {
    const customer = await createCustomerAgent();
    const first = await customer.post("/api/addresses").send(validAddress);
    const second = await customer
      .post("/api/addresses")
      .send({ ...validAddress, addressLine: "A different address line" });

    const res = await customer.delete(`/api/addresses/${second.body.data._id}`);

    expect(res.status).toBe(200);
    const firstInDb = await Address.findById(first.body.data._id);
    expect(firstInDb.isDefault).toBe(true);
    expect(await Address.countDocuments()).toBe(1);
  });

  // ADR-065: deleting the default with others remaining promotes one
  // automatically — this app's choice is the most-recently-created
  // survivor (documented in the controller and ADR-065's addendum).
  it("promotes the most-recently-created remaining address when the default is deleted", async () => {
    const customer = await createCustomerAgent();
    const first = await customer.post("/api/addresses").send(validAddress); // default
    const second = await customer
      .post("/api/addresses")
      .send({ ...validAddress, addressLine: "Second address line here" });
    const third = await customer
      .post("/api/addresses")
      .send({ ...validAddress, addressLine: "Third address line here" });

    const res = await customer.delete(`/api/addresses/${first.body.data._id}`);
    expect(res.status).toBe(200);

    const secondInDb = await Address.findById(second.body.data._id);
    const thirdInDb = await Address.findById(third.body.data._id);
    // third was created after second, so third is the promoted default.
    expect(thirdInDb.isDefault).toBe(true);
    expect(secondInDb.isDefault).toBe(false);

    const defaultCount = await Address.countDocuments({
      user: secondInDb.user,
      isDefault: true,
    });
    expect(defaultCount).toBe(1);
  });

  it("deleting the only address leaves an empty list, no error", async () => {
    const customer = await createCustomerAgent();
    const created = await customer.post("/api/addresses").send(validAddress);

    const res = await customer.delete(`/api/addresses/${created.body.data._id}`);

    expect(res.status).toBe(200);
    expect(await Address.countDocuments()).toBe(0);
  });

  it("returns 404 for an address that doesn't exist", async () => {
    const customer = await createCustomerAgent();

    const res = await customer.delete("/api/addresses/64b000000000000000000000");

    expect(res.status).toBe(404);
  });

  it("returns 404, and does not delete, for someone else's address", async () => {
    const owner = await User.create({
      name: "Owner",
      email: "owner@test.com",
      password: "testpassword123",
      role: "customer",
    });
    const ownerAddress = await Address.create({
      ...validAddress,
      user: owner._id,
      isDefault: true,
    });

    const customer = await createCustomerAgent();
    const res = await customer.delete(`/api/addresses/${ownerAddress._id}`);

    expect(res.status).toBe(404);
    expect(await Address.findById(ownerAddress._id)).not.toBeNull();
  });
});
