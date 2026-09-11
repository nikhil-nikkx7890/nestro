import request from "supertest";
import app from "../src/app.js";
import Order from "../src/models/order.model.js";
import User from "../src/models/user.model.js";
import ProductVariant from "../src/models/productVariant.model.js";
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

/**
 * createCustomerAgent (fixtures/auth.js) always creates the same
 * customer@test.com and returns only the logged-in agent, not the user
 * document — most tests below need both (the agent to call the API as,
 * the user id to build an Order against), so this wraps both together.
 */
const createCustomer = async () => {
  const agent = await createCustomerAgent();
  const user = await User.findOne({ email: "customer@test.com" });
  return { agent, user };
};

const createOtherCustomer = async () =>
  User.create({
    name: "Owner",
    email: "owner@test.com",
    password: "testpassword123",
    role: "customer",
  });

/**
 * Builds a real Order document directly, bypassing checkout entirely —
 * checkout's own correctness (snapshotting, stock decrement, rollback)
 * is covered in checkout.test.js; these tests are about ownership,
 * status transitions, and the cancellation window, which don't need a
 * full checkout round-trip to set up. Needs a real ProductVariant so
 * restock assertions have something to check.
 */
const createTestOrder = async (userId, variant, overrides = {}) =>
  Order.create({
    user: userId,
    items: [
      {
        variant: variant._id,
        product: variant.product,
        name: "Test Sofa",
        sku: variant.sku,
        image: "",
        material: "Sheesham Wood",
        color: "Walnut Brown",
        price: variant.price,
        quantity: 2,
      },
    ],
    shippingAddress: {
      fullName: "Nikhil Choudhary",
      phone: "9876543210",
      addressLine: "221B Baker Colony, Sector 12",
      city: "Jaipur",
      state: "Rajasthan",
      pincode: "302012",
      country: "India",
      addressType: "Home",
      landmark: "",
    },
    paymentMethod: "COD",
    status: "Pending",
    subtotal: variant.price * 2,
    shippingFee: 0,
    total: variant.price * 2,
    ...overrides,
  });

const setupVariant = async () => {
  const { category, brand, roomType, material, color } = await createMasterData();
  const product = await createTestProduct({ category, brand, roomType });
  const variant = await ProductVariant.create({
    product: product._id,
    sku: "ORDER-TEST-SKU-0001",
    price: 250000,
    material: material._id,
    color: color._id,
    stock: 5,
  });
  return { product, variant };
};

describe("GET /api/orders", () => {
  it("rejects an anonymous caller with 401", async () => {
    const res = await request(app).get("/api/orders");
    expect(res.status).toBe(401);
  });

  it("a customer sees only their own orders", async () => {
    const { variant } = await setupVariant();
    const owner = await createOtherCustomer();
    await createTestOrder(owner._id, variant);

    const { agent, user } = await createCustomer();
    const ownOrder = await createTestOrder(user._id, variant);

    const res = await agent.get("/api/orders");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]._id).toBe(ownOrder._id.toString());
  });

  it("an admin sees every order, across customers", async () => {
    const { variant } = await setupVariant();
    const { user } = await createCustomer();
    const owner = await createOtherCustomer();

    await createTestOrder(user._id, variant);
    await createTestOrder(owner._id, variant);

    const admin = await createAdminAgent();
    const res = await admin.get("/api/orders");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });

  it("lets an admin filter by status", async () => {
    const { variant } = await setupVariant();
    const { user } = await createCustomer();

    await createTestOrder(user._id, variant, { status: "Pending" });
    await createTestOrder(user._id, variant, { status: "Delivered" });

    const admin = await createAdminAgent();
    const res = await admin.get("/api/orders").query({ status: "Delivered" });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].status).toBe("Delivered");
  });
});

describe("GET /api/orders/:id", () => {
  it("returns 401 for an anonymous caller", async () => {
    const res = await request(app).get("/api/orders/64b000000000000000000000");
    expect(res.status).toBe(401);
  });

  it("lets a customer view their own order", async () => {
    const { variant } = await setupVariant();
    const { agent, user } = await createCustomer();
    const order = await createTestOrder(user._id, variant);

    const res = await agent.get(`/api/orders/${order._id}`);

    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe(order._id.toString());
  });

  it("returns 404, not another customer's order, for someone else's order id", async () => {
    const { variant } = await setupVariant();
    const owner = await createOtherCustomer();
    const ownerOrder = await createTestOrder(owner._id, variant);

    const { agent } = await createCustomer();
    const res = await agent.get(`/api/orders/${ownerOrder._id}`);

    expect(res.status).toBe(404);
  });

  it("lets an admin view any order", async () => {
    const { variant } = await setupVariant();
    const owner = await createOtherCustomer();
    const order = await createTestOrder(owner._id, variant);

    const admin = await createAdminAgent();
    const res = await admin.get(`/api/orders/${order._id}`);

    expect(res.status).toBe(200);
  });

  it("returns 404 for an order that doesn't exist", async () => {
    const { agent } = await createCustomer();
    const res = await agent.get("/api/orders/64b000000000000000000000");
    expect(res.status).toBe(404);
  });
});

describe("POST /api/orders/:id/cancel", () => {
  it("rejects an admin — cancel is customer-initiated", async () => {
    const { variant } = await setupVariant();
    const { user } = await createCustomer();
    const order = await createTestOrder(user._id, variant);

    const admin = await createAdminAgent();
    const res = await admin.post(`/api/orders/${order._id}/cancel`);

    expect(res.status).toBe(403);
  });

  it.each(["Pending", "Confirmed", "Processing"])(
    "cancels and restocks while status is %s",
    async (status) => {
      const { variant } = await setupVariant();
      const { agent, user } = await createCustomer();
      const order = await createTestOrder(user._id, variant, { status });

      const res = await agent.post(`/api/orders/${order._id}/cancel`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("Cancelled");

      const variantInDb = await ProductVariant.findById(variant._id);
      expect(variantInDb.stock).toBe(7); // 5 + the order's 2 restocked
    },
  );

  it.each(["Shipped", "OutForDelivery", "Delivered", "Cancelled", "Returned"])(
    "blocks cancellation once status is %s, and does not restock",
    async (status) => {
      const { variant } = await setupVariant();
      const { agent, user } = await createCustomer();
      const order = await createTestOrder(user._id, variant, { status });

      const res = await agent.post(`/api/orders/${order._id}/cancel`);

      expect(res.status).toBe(400);

      const variantInDb = await ProductVariant.findById(variant._id);
      expect(variantInDb.stock).toBe(5); // untouched

      const orderInDb = await Order.findById(order._id);
      expect(orderInDb.status).toBe(status); // unchanged
    },
  );

  it("returns 404, and does not cancel, for someone else's order", async () => {
    const { variant } = await setupVariant();
    const owner = await createOtherCustomer();
    const order = await createTestOrder(owner._id, variant);

    const { agent } = await createCustomer();
    const res = await agent.post(`/api/orders/${order._id}/cancel`);

    expect(res.status).toBe(404);

    const orderInDb = await Order.findById(order._id);
    expect(orderInDb.status).toBe("Pending");
  });
});

describe("PATCH /api/orders/:id/status", () => {
  it("rejects a customer — status changes are admin-only", async () => {
    const { variant } = await setupVariant();
    const { agent, user } = await createCustomer();
    const order = await createTestOrder(user._id, variant);

    const res = await agent
      .patch(`/api/orders/${order._id}/status`)
      .send({ status: "Confirmed" });

    expect(res.status).toBe(403);
  });

  it("rejects an unknown status value", async () => {
    const { variant } = await setupVariant();
    const { user } = await createCustomer();
    const order = await createTestOrder(user._id, variant);

    const admin = await createAdminAgent();
    const res = await admin
      .patch(`/api/orders/${order._id}/status`)
      .send({ status: "InTransitToTheMoon" });

    expect(res.status).toBe(400);
  });

  it.each([
    ["Pending", "Confirmed"],
    ["Confirmed", "Processing"],
    ["Processing", "Shipped"],
    ["Shipped", "OutForDelivery"],
    ["OutForDelivery", "Delivered"],
  ])("allows the single forward step %s -> %s", async (from, to) => {
    const { variant } = await setupVariant();
    const { user } = await createCustomer();
    const order = await createTestOrder(user._id, variant, { status: from });

    const admin = await createAdminAgent();
    const res = await admin.patch(`/api/orders/${order._id}/status`).send({ status: to });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe(to);
  });

  // ADR-066: "not a shortened version" — skipping a stage must be
  // rejected, not treated as a shortcut through the lifecycle.
  it("rejects skipping a stage (Pending -> Processing)", async () => {
    const { variant } = await setupVariant();
    const { user } = await createCustomer();
    const order = await createTestOrder(user._id, variant, { status: "Pending" });

    const admin = await createAdminAgent();
    const res = await admin
      .patch(`/api/orders/${order._id}/status`)
      .send({ status: "Processing" });

    expect(res.status).toBe(400);
    const orderInDb = await Order.findById(order._id);
    expect(orderInDb.status).toBe("Pending");
  });

  it("rejects moving backward (Confirmed -> Pending)", async () => {
    const { variant } = await setupVariant();
    const { user } = await createCustomer();
    const order = await createTestOrder(user._id, variant, { status: "Confirmed" });

    const admin = await createAdminAgent();
    const res = await admin
      .patch(`/api/orders/${order._id}/status`)
      .send({ status: "Pending" });

    expect(res.status).toBe(400);
  });

  it.each(["Pending", "Confirmed", "Processing"])(
    "allows admin-initiated Cancelled from %s, and restocks",
    async (status) => {
      const { variant } = await setupVariant();
      const { user } = await createCustomer();
      const order = await createTestOrder(user._id, variant, { status });

      const admin = await createAdminAgent();
      const res = await admin
        .patch(`/api/orders/${order._id}/status`)
        .send({ status: "Cancelled" });

      expect(res.status).toBe(200);
      const variantInDb = await ProductVariant.findById(variant._id);
      expect(variantInDb.stock).toBe(7); // 5 + 2 restocked
    },
  );

  // Admin doesn't get a wider cancel window than the customer does
  // (ADR-066's own reasoning — see order.controller.js's CANCELLABLE_FROM).
  it("rejects Cancelled once the order has Shipped", async () => {
    const { variant } = await setupVariant();
    const { user } = await createCustomer();
    const order = await createTestOrder(user._id, variant, { status: "Shipped" });

    const admin = await createAdminAgent();
    const res = await admin
      .patch(`/api/orders/${order._id}/status`)
      .send({ status: "Cancelled" });

    expect(res.status).toBe(400);
    const variantInDb = await ProductVariant.findById(variant._id);
    expect(variantInDb.stock).toBe(5); // untouched
  });

  it("allows Returned from Delivered, and restocks", async () => {
    const { variant } = await setupVariant();
    const { user } = await createCustomer();
    const order = await createTestOrder(user._id, variant, { status: "Delivered" });

    const admin = await createAdminAgent();
    const res = await admin
      .patch(`/api/orders/${order._id}/status`)
      .send({ status: "Returned" });

    expect(res.status).toBe(200);
    const variantInDb = await ProductVariant.findById(variant._id);
    expect(variantInDb.stock).toBe(7); // 5 + 2 restocked
  });

  it.each(["Pending", "Confirmed", "Processing", "Shipped", "OutForDelivery"])(
    "rejects Returned from %s — only Delivered can be returned",
    async (status) => {
      const { variant } = await setupVariant();
      const { user } = await createCustomer();
      const order = await createTestOrder(user._id, variant, { status });

      const admin = await createAdminAgent();
      const res = await admin
        .patch(`/api/orders/${order._id}/status`)
        .send({ status: "Returned" });

      expect(res.status).toBe(400);
      const variantInDb = await ProductVariant.findById(variant._id);
      expect(variantInDb.stock).toBe(5); // untouched
    },
  );

  it("returns 404 for an order that doesn't exist", async () => {
    const admin = await createAdminAgent();
    const res = await admin
      .patch("/api/orders/64b000000000000000000000/status")
      .send({ status: "Confirmed" });

    expect(res.status).toBe(404);
  });
});
