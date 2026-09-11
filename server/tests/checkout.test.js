import request from "supertest";
import app from "../src/app.js";
import Order from "../src/models/order.model.js";
import Address from "../src/models/address.model.js";
import User from "../src/models/user.model.js";
import Color from "../src/models/color.model.js";
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

const createVariant = async (product, { material, color }, overrides = {}) =>
  ProductVariant.create({
    product: product._id,
    sku: overrides.sku || "CHECKOUT-TEST-SKU-0001",
    price: 250000,
    material: material._id,
    color: color._id,
    stock: 10,
    ...overrides,
  });

const validAddress = {
  fullName: "Nikhil Choudhary",
  phone: "9876543210",
  addressLine: "221B Baker Colony, Sector 12",
  city: "Jaipur",
  state: "Rajasthan",
  pincode: "302012",
};

describe("Checkout auth (ADR-037)", () => {
  it("rejects an anonymous caller with 401", async () => {
    const res = await request(app).post("/api/checkout").send({ addressId: "irrelevant" });
    expect(res.status).toBe(401);
  });

  it("rejects a logged-in admin with 403 — checkout is Customer-only", async () => {
    const admin = await createAdminAgent();
    const res = await admin.post("/api/checkout").send({ addressId: "irrelevant" });
    expect(res.status).toBe(403);
  });
});

describe("POST /api/checkout", () => {
  it("rejects a missing addressId", async () => {
    const customer = await createCustomerAgent();
    const res = await customer.post("/api/checkout").send({});
    expect(res.status).toBe(400);
  });

  it("rejects an addressId that isn't a valid ObjectId", async () => {
    const customer = await createCustomerAgent();
    const res = await customer.post("/api/checkout").send({ addressId: "not-an-id" });
    expect(res.status).toBe(400);
  });

  it("returns 404 for an addressId that doesn't exist", async () => {
    const customer = await createCustomerAgent();

    const res = await customer
      .post("/api/checkout")
      .send({ addressId: "64b000000000000000000000" });
    expect(res.status).toBe(404);
  });

  it("returns 404 for an address belonging to another customer", async () => {
    const owner = await User.create({
      name: "Owner",
      email: "owner@test.com",
      password: "testpassword123",
      role: "customer",
    });
    const ownerAddress = await Address.create({ ...validAddress, user: owner._id });

    const customer = await createCustomerAgent();
    const res = await customer
      .post("/api/checkout")
      .send({ addressId: ownerAddress._id.toString() });

    expect(res.status).toBe(404);
  });

  it("rejects checkout with an empty cart", async () => {
    const customer = await createCustomerAgent();
    const address = await customer.post("/api/addresses").send(validAddress);

    const res = await customer.post("/api/checkout").send({ addressId: address.body.data._id });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/empty/i);
  });

  it("places an order: snapshots items and address, decrements stock, clears the cart", async () => {
    const { category, brand, roomType, material, color } = await createMasterData();
    const product = await createTestProduct({ category, brand, roomType });
    const variant = await createVariant(product, { material, color }, { stock: 10 });

    const customer = await createCustomerAgent();
    const address = await customer.post("/api/addresses").send(validAddress);
    await customer.post("/api/cart/items").send({ variant: variant._id.toString(), quantity: 3 });

    const res = await customer
      .post("/api/checkout")
      .send({ addressId: address.body.data._id });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe("Pending");
    expect(res.body.data.paymentMethod).toBe("COD");
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].variant).toBe(variant._id.toString());
    expect(res.body.data.items[0].name).toBe(product.name);
    expect(res.body.data.items[0].sku).toBe(variant.sku);
    expect(res.body.data.items[0].price).toBe(250000);
    expect(res.body.data.items[0].quantity).toBe(3);
    expect(res.body.data.subtotal).toBe(750000);
    expect(res.body.data.total).toBe(750000);
    expect(res.body.data.shippingAddress.fullName).toBe(validAddress.fullName);
    expect(res.body.data.shippingAddress.addressLine).toBe(validAddress.addressLine);

    const variantInDb = await ProductVariant.findById(variant._id);
    expect(variantInDb.stock).toBe(7); // 10 - 3

    const cartRes = await customer.get("/api/cart");
    expect(cartRes.body.data.items).toEqual([]);
  });

  // The order's shippingAddress must survive the source Address being
  // edited afterward — it's a snapshot, not a live reference (ADR-066,
  // closing ADR-026 for the shipping address specifically).
  it("keeps the order's shipping address unchanged after the source Address is edited", async () => {
    const { category, brand, roomType, material, color } = await createMasterData();
    const product = await createTestProduct({ category, brand, roomType });
    const variant = await createVariant(product, { material, color });

    const customer = await createCustomerAgent();
    const address = await customer.post("/api/addresses").send(validAddress);
    await customer.post("/api/cart/items").send({ variant: variant._id.toString(), quantity: 1 });

    const orderRes = await customer
      .post("/api/checkout")
      .send({ addressId: address.body.data._id });

    await customer
      .patch(`/api/addresses/${address.body.data._id}`)
      .send({ city: "A Totally Different City" });

    const orderInDb = await Order.findById(orderRes.body.data._id);
    expect(orderInDb.shippingAddress.city).toBe(validAddress.city);
  });

  // Stock drops out from under an already-placed cart line — the
  // realistic version of this (someone else buys the last few units
  // between "added to cart" and "clicked checkout"), not a quantity
  // addCartItem would have rejected up front.
  it("rejects checkout when stock is insufficient, and does not create an order", async () => {
    const { category, brand, roomType, material, color } = await createMasterData();
    const product = await createTestProduct({ category, brand, roomType });
    const variant = await createVariant(product, { material, color }, { stock: 5 });

    const customer = await createCustomerAgent();
    const address = await customer.post("/api/addresses").send(validAddress);
    await customer.post("/api/cart/items").send({ variant: variant._id.toString(), quantity: 5 });

    // Stock drops after the cart line was added, before checkout runs.
    await ProductVariant.updateOne({ _id: variant._id }, { stock: 2 });

    const res = await customer
      .post("/api/checkout")
      .send({ addressId: address.body.data._id });

    expect(res.status).toBe(409);

    const variantInDb = await ProductVariant.findById(variant._id);
    expect(variantInDb.stock).toBe(2); // untouched

    expect(await Order.countDocuments()).toBe(0);

    // Cart survives a failed checkout — nothing was actually purchased.
    const cartRes = await customer.get("/api/cart");
    expect(cartRes.body.data.items).toHaveLength(1);
  });

  // The rollback case: with two lines in the cart, the first decrements
  // successfully before the second fails — that first decrement must be
  // undone, not left as a partial, silent stock loss.
  it("rolls back an earlier successful decrement when a later item fails", async () => {
    const { category, brand, roomType, material, color } = await createMasterData();
    const product = await createTestProduct({ category, brand, roomType });
    // A second, distinct color — the (product, material, color) compound
    // unique index means two variants on the same product can't otherwise
    // share a material+color pair, regardless of SKU.
    const secondColor = await Color.create({ name: "Charcoal Grey", hexCode: "#36454F" });
    const okVariant = await createVariant(
      product,
      { material, color },
      { sku: "ROLLBACK-OK-0001", stock: 10 },
    );
    const shortVariant = await createVariant(
      product,
      { material, color: secondColor },
      { sku: "ROLLBACK-SHORT-0001", stock: 5 },
    );

    const customer = await createCustomerAgent();
    const address = await customer.post("/api/addresses").send(validAddress);
    await customer
      .post("/api/cart/items")
      .send({ variant: okVariant._id.toString(), quantity: 2 });
    await customer
      .post("/api/cart/items")
      .send({ variant: shortVariant._id.toString(), quantity: 5 }); // fine at add-time (stock: 5)

    // Stock drops after the cart line was added, before checkout runs —
    // addCartItem's own guard would otherwise reject this quantity
    // outright, which would test that check instead of checkout's.
    await ProductVariant.updateOne({ _id: shortVariant._id }, { stock: 1 });

    const res = await customer
      .post("/api/checkout")
      .send({ addressId: address.body.data._id });

    expect(res.status).toBe(409);

    const okInDb = await ProductVariant.findById(okVariant._id);
    expect(okInDb.stock).toBe(10); // rolled back to its original value, not left at 8

    const shortInDb = await ProductVariant.findById(shortVariant._id);
    expect(shortInDb.stock).toBe(1); // never touched — it was the one that failed

    expect(await Order.countDocuments()).toBe(0);
  });

  // The actual atomicity claim: two customers racing for the last unit
  // of the same variant must not both succeed. A sequential test can't
  // prove this — only firing genuinely concurrent requests can.
  it("only lets one of two concurrent checkouts for the last unit succeed", async () => {
    const { category, brand, roomType, material, color } = await createMasterData();
    const product = await createTestProduct({ category, brand, roomType });
    const variant = await createVariant(product, { material, color }, { stock: 1 });

    const customerA = request.agent(app);
    await customerA.post("/api/auth/register").send({
      name: "Customer A",
      email: "race-a@test.com",
      password: "testpassword123",
    });
    await customerA
      .post("/api/auth/login")
      .send({ email: "race-a@test.com", password: "testpassword123" });

    const customerB = request.agent(app);
    await customerB.post("/api/auth/register").send({
      name: "Customer B",
      email: "race-b@test.com",
      password: "testpassword123",
    });
    await customerB
      .post("/api/auth/login")
      .send({ email: "race-b@test.com", password: "testpassword123" });

    const addressA = await customerA.post("/api/addresses").send(validAddress);
    const addressB = await customerB.post("/api/addresses").send(validAddress);
    await customerA
      .post("/api/cart/items")
      .send({ variant: variant._id.toString(), quantity: 1 });
    await customerB
      .post("/api/cart/items")
      .send({ variant: variant._id.toString(), quantity: 1 });

    const [resA, resB] = await Promise.all([
      customerA.post("/api/checkout").send({ addressId: addressA.body.data._id }),
      customerB.post("/api/checkout").send({ addressId: addressB.body.data._id }),
    ]);

    const statuses = [resA.status, resB.status].sort();
    expect(statuses).toEqual([201, 409]);

    const variantInDb = await ProductVariant.findById(variant._id);
    expect(variantInDb.stock).toBe(0); // not -1, not 1

    expect(await Order.countDocuments()).toBe(1);
  });
});
