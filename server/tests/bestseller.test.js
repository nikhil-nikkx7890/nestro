import mongoose from "mongoose";
import request from "supertest";
import app from "../src/app.js";
import Category from "../src/models/category.model.js";
import Product from "../src/models/product.model.js";
import Order from "../src/models/order.model.js";
import User from "../src/models/user.model.js";
import { connectTestDB, clearTestDB, disconnectTestDB } from "./setup/testDb.js";
import { createMasterData } from "./fixtures/masterData.js";

beforeAll(async () => {
  await connectTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

let buyerCount = 0;
/** A distinct customer per order — Order has no rule against one user
 * placing several, but a fresh one per call keeps each test's intent
 * (a specific product/quantity/status combination) obvious without
 * tracking shared state across calls. */
const createBuyer = async () => {
  buyerCount += 1;
  return User.create({
    name: `Buyer ${buyerCount}`,
    email: `bestseller-buyer-${buyerCount}@test.com`,
    password: "testpassword123",
    role: "customer",
  });
};

const createProductIn = async (category, { brand, roomType }) =>
  Product.create({
    name: `Bestseller Test Product ${new mongoose.Types.ObjectId()}`,
    category: category._id,
    brand: brand._id,
    roomTypes: [roomType._id],
    status: "published",
  });

/** One order for one product/quantity/status — units sold is a sum
 * across possibly-several orders, so tests build up totals from more
 * than one of these where that matters. */
const createOrder = async (product, { quantity = 1, status = "Delivered" } = {}) => {
  const user = await createBuyer();
  return Order.create({
    user: user._id,
    items: [
      {
        variant: new mongoose.Types.ObjectId(),
        product: product._id,
        name: product.name,
        sku: `BESTSELLER-TEST-${new mongoose.Types.ObjectId()}`,
        price: 100000,
        quantity,
      },
    ],
    shippingAddress: {
      fullName: "Test Customer",
      phone: "9876543210",
      addressLine: "221B Baker Colony, Sector 12",
      city: "Jaipur",
      state: "Rajasthan",
      pincode: "302012",
      country: "India",
    },
    paymentMethod: "COD",
    paymentStatus: "N/A",
    status,
    subtotal: 100000 * quantity,
    shippingFee: 0,
    total: 100000 * quantity,
  });
};

describe("Bestseller badge (ADR-068) — GET /api/products", () => {
  it("marks the product with the most Delivered units sold in its category, not the other", async () => {
    const { category, brand, roomType } = await createMasterData();
    const bestseller = await createProductIn(category, { brand, roomType });
    const runnerUp = await createProductIn(category, { brand, roomType });

    await createOrder(bestseller, { quantity: 3 });
    await createOrder(runnerUp, { quantity: 1 });

    const res = await request(app).get("/api/products");

    const bestsellerRow = res.body.data.find((p) => p._id === String(bestseller._id));
    const runnerUpRow = res.body.data.find((p) => p._id === String(runnerUp._id));

    expect(bestsellerRow.isBestseller).toBe(true);
    expect(runnerUpRow.isBestseller).toBe(false);
  });

  it("sums quantity across multiple Delivered orders for the same product", async () => {
    const { category, brand, roomType } = await createMasterData();
    const bestseller = await createProductIn(category, { brand, roomType });
    const runnerUp = await createProductIn(category, { brand, roomType });

    // Two smaller Delivered orders (2 + 2 = 4) beat one bigger one (3).
    await createOrder(bestseller, { quantity: 2 });
    await createOrder(bestseller, { quantity: 2 });
    await createOrder(runnerUp, { quantity: 3 });

    const res = await request(app).get("/api/products");

    const bestsellerRow = res.body.data.find((p) => p._id === String(bestseller._id));
    expect(bestsellerRow.isBestseller).toBe(true);
  });

  it("does not count Pending, Shipped, Cancelled, or Returned orders toward units sold", async () => {
    const { category, brand, roomType } = await createMasterData();
    const smallDeliveredWinner = await createProductIn(category, { brand, roomType });
    const bigButNotDelivered = await createProductIn(category, { brand, roomType });

    await createOrder(smallDeliveredWinner, { quantity: 1, status: "Delivered" });
    await createOrder(bigButNotDelivered, { quantity: 50, status: "Pending" });
    await createOrder(bigButNotDelivered, { quantity: 50, status: "Shipped" });
    await createOrder(bigButNotDelivered, { quantity: 50, status: "Cancelled" });
    await createOrder(bigButNotDelivered, { quantity: 50, status: "Returned" });

    const res = await request(app).get("/api/products");

    const winnerRow = res.body.data.find((p) => p._id === String(smallDeliveredWinner._id));
    const loserRow = res.body.data.find((p) => p._id === String(bigButNotDelivered._id));

    expect(winnerRow.isBestseller).toBe(true);
    expect(loserRow.isBestseller).toBe(false);
  });

  it("marks no product as bestseller in a category with zero Delivered sales", async () => {
    const { category, brand, roomType } = await createMasterData();
    const productA = await createProductIn(category, { brand, roomType });
    const productB = await createProductIn(category, { brand, roomType });

    // Only a non-Delivered order exists — the category has no qualifying
    // sales at all yet.
    await createOrder(productA, { quantity: 5, status: "Processing" });

    const res = await request(app).get("/api/products");

    const rowA = res.body.data.find((p) => p._id === String(productA._id));
    const rowB = res.body.data.find((p) => p._id === String(productB._id));

    expect(rowA.isBestseller).toBe(false);
    expect(rowB.isBestseller).toBe(false);
  });

  it("computes each category's bestseller independently of other categories", async () => {
    const { category: categoryX, brand, roomType } = await createMasterData();
    const categoryY = await Category.create({ name: "Second Category" });

    const xWinner = await createProductIn(categoryX, { brand, roomType });
    const xLoser = await createProductIn(categoryX, { brand, roomType });
    const yWinner = await createProductIn(categoryY, { brand, roomType });
    const yLoser = await createProductIn(categoryY, { brand, roomType });

    // categoryY's totals are larger in absolute terms, which must not
    // affect categoryX's own comparison — each category picks its own
    // leader, not a single site-wide one (ADR-068's core decision).
    await createOrder(xWinner, { quantity: 2 });
    await createOrder(xLoser, { quantity: 1 });
    await createOrder(yWinner, { quantity: 20 });
    await createOrder(yLoser, { quantity: 10 });

    const res = await request(app).get("/api/products");
    const byId = (id) => res.body.data.find((p) => p._id === String(id));

    expect(byId(xWinner._id).isBestseller).toBe(true);
    expect(byId(xLoser._id).isBestseller).toBe(false);
    expect(byId(yWinner._id).isBestseller).toBe(true);
    expect(byId(yLoser._id).isBestseller).toBe(false);
  });
});

describe("Bestseller badge (ADR-068) — GET /api/products/:productId", () => {
  it("reports isBestseller: true on the detail response for the category leader", async () => {
    const { category, brand, roomType } = await createMasterData();
    const bestseller = await createProductIn(category, { brand, roomType });
    const runnerUp = await createProductIn(category, { brand, roomType });

    await createOrder(bestseller, { quantity: 5 });
    await createOrder(runnerUp, { quantity: 1 });

    const res = await request(app).get(`/api/products/${bestseller._id}`);

    expect(res.status).toBe(200);
    expect(res.body.data.isBestseller).toBe(true);
  });

  it("reports isBestseller: false on the detail response for the runner-up", async () => {
    const { category, brand, roomType } = await createMasterData();
    const bestseller = await createProductIn(category, { brand, roomType });
    const runnerUp = await createProductIn(category, { brand, roomType });

    await createOrder(bestseller, { quantity: 5 });
    await createOrder(runnerUp, { quantity: 1 });

    const res = await request(app).get(`/api/products/${runnerUp._id}`);

    expect(res.status).toBe(200);
    expect(res.body.data.isBestseller).toBe(false);
  });
});
