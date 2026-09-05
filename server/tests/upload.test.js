import request from "supertest";
import app from "../src/app.js";
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

/**
 * Rejection paths only, deliberately. A successful upload calls Cloudinary,
 * which needs real credentials and would make the suite depend on a network
 * service — so there is no success-path test here. Everything below fails
 * before Cloudinary is ever reached (in the multer layer), which is exactly
 * the layer ADR-058 changed.
 */
const PNG = { filename: "photo.png", contentType: "image/png" };
const tinyFile = Buffer.from("not really an image");

describe("POST /api/upload/image — authorization", () => {
  it("rejects the request when no one is logged in", async () => {
    const res = await request(app)
      .post("/api/upload/image")
      .attach("image", tinyFile, PNG);

    expect(res.status).toBe(401);
  });

  it("rejects a logged-in customer (admin-only)", async () => {
    const customerAgent = await createCustomerAgent();

    const res = await customerAgent
      .post("/api/upload/image")
      .attach("image", tinyFile, PNG);

    expect(res.status).toBe(403);
  });
});

// ADR-058. Before this, fileFilter admitted anything declared image/* and
// called back with a bare Error — so a rejected upload surfaced as a 500
// "Something went wrong." rather than a 400 saying what was wrong.
describe("POST /api/upload/image — file type allowlist (ADR-058)", () => {
  it("rejects a non-image with 400 and a message naming the allowed types", async () => {
    const adminAgent = await createAdminAgent();

    const res = await adminAgent
      .post("/api/upload/image")
      .attach("image", tinyFile, { filename: "notes.txt", contentType: "text/plain" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/PNG, JPEG, WebP or GIF/);
  });

  it("rejects SVG, which the old image/* prefix test allowed through", async () => {
    const adminAgent = await createAdminAgent();
    const scriptedSvg = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
    );

    const res = await adminAgent
      .post("/api/upload/image")
      .attach("image", scriptedSvg, { filename: "x.svg", contentType: "image/svg+xml" });

    // Cloudinary stores SVG as an image, so a scripted one would have been
    // served from the delivery URL and executed for anyone opening it.
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/PNG, JPEG, WebP or GIF/);
  });

  it.each(["image/png", "image/jpeg", "image/webp", "image/gif"])(
    "does not reject %s at the filter",
    async (contentType) => {
      const adminAgent = await createAdminAgent();

      const res = await adminAgent
        .post("/api/upload/image")
        .attach("image", tinyFile, { filename: "photo", contentType });

      // Past the filter, so the failure is Cloudinary's (no credentials in
      // tests), never the 400 the filter itself produces.
      expect(res.status).not.toBe(400);
    },
  );
});

describe("POST /api/upload/image — multer errors map to 400 (ADR-058)", () => {
  it("returns 400 with the size limit when the file exceeds 5MB", async () => {
    const adminAgent = await createAdminAgent();
    const tooBig = Buffer.alloc(6 * 1024 * 1024, 0x41);

    const res = await adminAgent
      .post("/api/upload/image")
      .attach("image", tooBig, PNG);

    // Previously a 500 "Something went wrong." — an ordinary mistake that
    // looked like a server crash and never told the admin the limit.
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/5MB/);
  });

  it("returns 400 when the file arrives under an unexpected field name", async () => {
    const adminAgent = await createAdminAgent();

    const res = await adminAgent
      .post("/api/upload/image")
      .attach("avatar", tinyFile, PNG);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Unexpected file field/);
  });

  it("returns 400 when no file is attached at all", async () => {
    const adminAgent = await createAdminAgent();

    const res = await adminAgent.post("/api/upload/image");

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/No image file/);
  });
});
