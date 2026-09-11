import { jest } from "@jest/globals";

// Real Razorpay Test Mode credentials still hit Razorpay's actual API —
// fine for a one-off manual check, wrong for an automated suite that
// must run offline and in CI with no real credentials configured. This
// mocks the one module that ever talks to Razorpay (config/razorpay.js)
// so these tests exercise Nestro's own checkout logic — what it sends,
// what it stores, how it rolls back on failure — without a network call.
// Jest's ESM support requires the mock to be registered before anything
// that transitively imports the mocked module, so every import below is
// a dynamic `await import()` rather than a static one (see Jest's
// `jest.unstable_mockModule` docs) — a different shape from every other
// test file in this suite, which don't need to mock anything external.
const mockOrdersCreate = jest.fn();

jest.unstable_mockModule("../src/config/razorpay.js", () => ({
  getRazorpayClient: () => ({
    orders: { create: mockOrdersCreate },
  }),
}));

const { default: request } = await import("supertest");
const { default: app } = await import("../src/app.js");
const { default: Order } = await import("../src/models/order.model.js");
const { default: ProductVariant } = await import("../src/models/productVariant.model.js");
const { connectTestDB, clearTestDB, disconnectTestDB } = await import("./setup/testDb.js");
const { createMasterData, createTestProduct } = await import("./fixtures/masterData.js");
const { createCustomerAgent } = await import("./fixtures/auth.js");

beforeAll(async () => {
  await connectTestDB();
});

afterEach(async () => {
  jest.clearAllMocks();
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

const setupCartAndAddress = async (customer, { stock = 10, quantity = 2 } = {}) => {
  const { category, brand, roomType, material, color } = await createMasterData();
  const product = await createTestProduct({ category, brand, roomType });
  const variant = await ProductVariant.create({
    product: product._id,
    sku: "RAZORPAY-TEST-SKU-0001",
    price: 300000,
    material: material._id,
    color: color._id,
    stock,
  });

  const address = await customer.post("/api/addresses").send(validAddress);
  await customer.post("/api/cart/items").send({ variant: variant._id.toString(), quantity });

  return { variant, addressId: address.body.data._id };
};

describe("POST /api/checkout — paymentMethod: Razorpay", () => {
  it("creates a Razorpay order for the cart total and stores its id on the Nestro Order", async () => {
    const customer = await createCustomerAgent();
    const { variant, addressId } = await setupCartAndAddress(customer, { quantity: 2 });

    mockOrdersCreate.mockResolvedValue({
      id: "order_mock_abc123",
      amount: 600000,
      currency: "INR",
    });

    const res = await customer
      .post("/api/checkout")
      .send({ addressId, paymentMethod: "Razorpay" });

    expect(res.status).toBe(201);
    expect(res.body.data.paymentMethod).toBe("Razorpay");
    // Not "N/A" (COD's value) and not "Paid" — checkout only ever opens
    // the payment session, it never confirms one (ADR-067).
    expect(res.body.data.paymentStatus).toBe("Pending");
    expect(res.body.data.razorpayOrderId).toBe("order_mock_abc123");

    // Everything the client's Checkout.js widget needs to open the
    // payment sheet for this specific order.
    expect(res.body.razorpay).toEqual({
      orderId: "order_mock_abc123",
      amount: 600000,
      currency: "INR",
      keyId: process.env.RAZORPAY_KEY_ID,
    });

    // Amount handed to Razorpay must be the real order total, in paise —
    // the same minor-unit convention this app already uses everywhere
    // else (ADR-023), not a rupee-scale or re-derived figure.
    expect(mockOrdersCreate).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 600000, currency: "INR" }),
    );

    const variantInDb = await ProductVariant.findById(variant._id);
    expect(variantInDb.stock).toBe(8); // decremented immediately, same as COD (ADR-066/067)
  });

  it("rolls back the stock decrement and creates no Order when Razorpay order creation fails", async () => {
    const customer = await createCustomerAgent();
    const { variant, addressId } = await setupCartAndAddress(customer, {
      stock: 5,
      quantity: 3,
    });

    mockOrdersCreate.mockRejectedValue(new Error("Razorpay API unreachable (simulated)"));

    const res = await customer
      .post("/api/checkout")
      .send({ addressId, paymentMethod: "Razorpay" });

    expect(res.status).toBe(502);

    const variantInDb = await ProductVariant.findById(variant._id);
    expect(variantInDb.stock).toBe(5); // rolled back, not left short

    expect(await Order.countDocuments()).toBe(0);

    // Failed checkout, same as the COD insufficient-stock case in
    // checkout.test.js — nothing was actually purchased, cart survives.
    const cartRes = await customer.get("/api/cart");
    expect(cartRes.body.data.items).toHaveLength(1);
  });

  it("defaults to COD and never calls Razorpay when paymentMethod is omitted", async () => {
    const customer = await createCustomerAgent();
    const { addressId } = await setupCartAndAddress(customer, { quantity: 1 });

    const res = await customer.post("/api/checkout").send({ addressId });

    expect(res.status).toBe(201);
    expect(res.body.data.paymentMethod).toBe("COD");
    expect(res.body.data.paymentStatus).toBe("N/A");
    expect(res.body.razorpay).toBeUndefined();
    expect(mockOrdersCreate).not.toHaveBeenCalled();
  });
});
