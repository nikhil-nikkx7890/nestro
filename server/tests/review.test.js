import request from "supertest";
import app from "../src/app.js";
import Review from "../src/models/review.model.js";
import Product from "../src/models/product.model.js";
import User from "../src/models/user.model.js";
import { connectTestDB, clearTestDB, disconnectTestDB } from "./setup/testDb.js";
import { createAdminAgent, createCustomerAgent } from "./fixtures/auth.js";
import { createMasterData, createTestProduct } from "./fixtures/masterData.js";

beforeAll(async () => {
  await connectTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

const validReview = { rating: 5, comment: "Solid build, arrived well packed." };

/** A published product — the storefront default an anonymous caller sees. */
const createPublishedProduct = async () => {
  const masterData = await createMasterData();
  const product = await createTestProduct(masterData);
  product.status = "published";
  await product.save();
  return product;
};

describe("POST /api/products/:productId/reviews", () => {
  it("lets a logged-in customer post a review", async () => {
    const product = await createPublishedProduct();
    const customer = await createCustomerAgent();

    const res = await customer
      .post(`/api/products/${product._id}/reviews`)
      .send(validReview);

    expect(res.status).toBe(201);
    expect(res.body.data.rating).toBe(5);
    expect(res.body.data.user.name).toBe("Test Customer");

    expect(await Review.countDocuments({ product: product._id })).toBe(1);
  });

  it("rejects the request when no one is logged in", async () => {
    const product = await createPublishedProduct();

    const res = await request(app)
      .post(`/api/products/${product._id}/reviews`)
      .send(validReview);

    expect(res.status).toBe(401);
  });

  it("forbids an admin from reviewing (customer-only, like Cart/Wishlist)", async () => {
    const product = await createPublishedProduct();
    const admin = await createAdminAgent();

    const res = await admin
      .post(`/api/products/${product._id}/reviews`)
      .send(validReview);

    expect(res.status).toBe(403);
  });

  it("blocks a second review of the same product by the same customer", async () => {
    const product = await createPublishedProduct();
    const customer = await createCustomerAgent();

    await customer.post(`/api/products/${product._id}/reviews`).send(validReview);
    const res = await customer
      .post(`/api/products/${product._id}/reviews`)
      .send({ rating: 3, comment: "Changed my mind about this one." });

    expect(res.status).toBe(409);
    expect(await Review.countDocuments({ product: product._id })).toBe(1);
  });

  it("rejects a rating outside 1-5", async () => {
    const product = await createPublishedProduct();
    const customer = await createCustomerAgent();

    const res = await customer
      .post(`/api/products/${product._id}/reviews`)
      .send({ rating: 6, comment: "Rating is out of range." });

    expect(res.status).toBe(400);
  });

  it("returns 404 for a draft product, not a distinct error (ADR-036)", async () => {
    const masterData = await createMasterData();
    const product = await createTestProduct(masterData); // defaults to draft
    const customer = await createCustomerAgent();

    const res = await customer
      .post(`/api/products/${product._id}/reviews`)
      .send(validReview);

    expect(res.status).toBe(404);
  });
});

describe("GET /api/products/:productId/reviews", () => {
  it("is public and returns a computed rating summary", async () => {
    const product = await createPublishedProduct();
    const customer = await createCustomerAgent();
    await customer.post(`/api/products/${product._id}/reviews`).send(validReview);

    const res = await request(app).get(`/api/products/${product._id}/reviews`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.summary.averageRating).toBe(5);
    expect(res.body.summary.reviewCount).toBe(1);
    expect(res.body.summary.distribution[5]).toBe(1);
  });

  it("averages across multiple reviewers", async () => {
    const product = await createPublishedProduct();
    const customer = await createCustomerAgent();
    await customer.post(`/api/products/${product._id}/reviews`).send(validReview);

    const second = await User.create({
      name: "Second Customer",
      email: "second@test.com",
      password: "testpassword123",
      role: "customer",
    });
    await Review.create({
      product: product._id,
      user: second._id,
      rating: 3,
      comment: "Fine, but the finish was uneven.",
    });

    const res = await request(app).get(`/api/products/${product._id}/reviews`);

    expect(res.body.summary.reviewCount).toBe(2);
    expect(res.body.summary.averageRating).toBe(4);
  });
});

describe("PUT /api/reviews/:reviewId", () => {
  it("lets a customer edit their own review", async () => {
    const product = await createPublishedProduct();
    const customer = await createCustomerAgent();
    const created = await customer
      .post(`/api/products/${product._id}/reviews`)
      .send(validReview);

    const res = await customer
      .put(`/api/reviews/${created.body.data._id}`)
      .send({ rating: 2, comment: "A leg loosened after a week of use." });

    expect(res.status).toBe(200);
    expect(res.body.data.rating).toBe(2);
  });

  it("stops a customer editing someone else's review", async () => {
    const product = await createPublishedProduct();
    const owner = await User.create({
      name: "Owner",
      email: "owner@test.com",
      password: "testpassword123",
      role: "customer",
    });
    const review = await Review.create({
      product: product._id,
      user: owner._id,
      rating: 4,
      comment: "Looks just like the photos.",
    });

    const otherCustomer = await createCustomerAgent();
    const res = await otherCustomer
      .put(`/api/reviews/${review._id}`)
      .send({ rating: 1, comment: "Trying to edit someone else's review." });

    expect(res.status).toBe(403);
  });
});

describe("DELETE /api/reviews/:reviewId", () => {
  it("lets a customer delete their own review", async () => {
    const product = await createPublishedProduct();
    const customer = await createCustomerAgent();
    const created = await customer
      .post(`/api/products/${product._id}/reviews`)
      .send(validReview);

    const res = await customer.delete(`/api/reviews/${created.body.data._id}`);

    expect(res.status).toBe(200);
    expect(await Review.countDocuments()).toBe(0);
  });

  it("lets an admin delete anyone's review (moderation)", async () => {
    const product = await createPublishedProduct();
    const author = await User.create({
      name: "Author",
      email: "author@test.com",
      password: "testpassword123",
      role: "customer",
    });
    const review = await Review.create({
      product: product._id,
      user: author._id,
      rating: 1,
      comment: "Spam content that an admin should be able to remove.",
    });

    const admin = await createAdminAgent();
    const res = await admin.delete(`/api/reviews/${review._id}`);

    expect(res.status).toBe(200);
    expect(await Review.countDocuments()).toBe(0);
  });
});

describe("GET /api/reviews (admin moderation list)", () => {
  it("returns every review to an admin, with product and user attached", async () => {
    const product = await createPublishedProduct();
    const customer = await createCustomerAgent();
    await customer.post(`/api/products/${product._id}/reviews`).send(validReview);

    const admin = await createAdminAgent();
    const res = await admin.get("/api/reviews");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].product.name).toBe("Test Sofa");
    expect(res.body.data[0].user.name).toBe("Test Customer");
  });

  it("rejects a customer (admin-only)", async () => {
    const customer = await createCustomerAgent();

    const res = await customer.get("/api/reviews");

    expect(res.status).toBe(403);
  });

  it("rejects the request when no one is logged in", async () => {
    const res = await request(app).get("/api/reviews");

    expect(res.status).toBe(401);
  });

  it("filters by rating", async () => {
    const product = await createPublishedProduct();
    const author = await User.create({
      name: "Author",
      email: "author@test.com",
      password: "testpassword123",
      role: "customer",
    });
    await Review.create({
      product: product._id,
      user: author._id,
      rating: 1,
      comment: "One star, the finish was badly chipped.",
    });

    const customer = await createCustomerAgent();
    await customer.post(`/api/products/${product._id}/reviews`).send(validReview); // 5 stars

    const admin = await createAdminAgent();
    const res = await admin.get("/api/reviews?rating=1");

    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].rating).toBe(1);
  });
});

describe("Ratings on product responses", () => {
  it("attaches averageRating and reviewCount to the product listing", async () => {
    const product = await createPublishedProduct();
    const customer = await createCustomerAgent();
    await customer
      .post(`/api/products/${product._id}/reviews`)
      .send({ rating: 4, comment: "Comfortable and well made overall." });

    const res = await request(app).get("/api/products");

    const listed = res.body.data.find((p) => p._id === String(product._id));
    expect(listed.averageRating).toBe(4);
    expect(listed.reviewCount).toBe(1);
  });

  it("reports a product with no reviews as null rather than zero", async () => {
    await createPublishedProduct();

    const res = await request(app).get("/api/products");

    expect(res.body.data[0].averageRating).toBeNull();
    expect(res.body.data[0].reviewCount).toBe(0);
  });
});
