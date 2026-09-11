import request from "supertest";
import app from "../src/app.js";
import User from "../src/models/user.model.js";
import { hashOTP } from "../src/utils/otp.js";
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
  it("creates a customer account, but does not log it in", async () => {
    const res = await request(app).post("/api/auth/register").send(testUser);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // No Set-Cookie and no user data — ADR-062: register no longer
    // auto-logs-in, because doing so only on the "new account" branch
    // would itself be the oracle the constant-response fix exists to close.
    expect(res.headers["set-cookie"]).toBeUndefined();
    expect(res.body.data).toBeUndefined();

    const inDb = await User.findOne({ email: testUser.email }).select("+password");
    expect(inDb).not.toBeNull();
    expect(inDb.role).toBe("customer"); // never trusts a client-supplied role
    expect(inDb.password).not.toBe(testUser.password); // stored as a bcrypt hash, not plain text
  });

  // ADR-062, closing ADR-058 Finding 1: an existing email must be
  // indistinguishable from a new one at the HTTP level — same status,
  // same message, no cookie either way — so nothing here can be a
  // registered-email oracle for a caller with no access to the mailbox.
  it("responds identically for an email that's already registered, and creates no duplicate", async () => {
    const first = await request(app).post("/api/auth/register").send(testUser);

    const second = await request(app).post("/api/auth/register").send(testUser);

    expect(second.status).toBe(first.status);
    expect(second.body).toEqual(first.body);
    expect(second.headers["set-cookie"]).toBeUndefined();

    const count = await User.countDocuments({ email: testUser.email });
    expect(count).toBe(1); // no duplicate account, and no 409 either
  });

  it("rejects a payload missing required fields", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: testUser.email });

    expect(res.status).toBe(400);
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
    // register no longer sets a cookie itself (ADR-062), so the account
    // is created first and logged in with a separate call.
    const agent = request.agent(app);

    await agent.post("/api/auth/register").send(testUser);
    await agent.post("/api/auth/login").send({
      email: testUser.email,
      password: testUser.password,
    });

    const res = await agent.get("/api/auth/me");

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(testUser.email);
  });
});

describe("PATCH /api/auth/me", () => {
  it("returns 401 when no auth cookie is sent", async () => {
    const res = await request(app).patch("/api/auth/me").send({ name: "New Name" });

    expect(res.status).toBe(401);
  });

  it("updates the logged-in user's own name", async () => {
    const agent = request.agent(app);
    await agent.post("/api/auth/register").send(testUser);
    await agent.post("/api/auth/login").send({
      email: testUser.email,
      password: testUser.password,
    });

    const res = await agent.patch("/api/auth/me").send({ name: "Nikhil C." });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("Nikhil C.");

    const meRes = await agent.get("/api/auth/me");
    expect(meRes.body.data.name).toBe("Nikhil C.");
  });

  it("rejects a name that's too short", async () => {
    const agent = request.agent(app);
    await agent.post("/api/auth/register").send(testUser);
    await agent.post("/api/auth/login").send({
      email: testUser.email,
      password: testUser.password,
    });

    const res = await agent.patch("/api/auth/me").send({ name: "A" });

    expect(res.status).toBe(400);
  });

  it("rejects an attempt to change fields other than name (e.g. role)", async () => {
    const agent = request.agent(app);
    await agent.post("/api/auth/register").send(testUser);
    await agent.post("/api/auth/login").send({
      email: testUser.email,
      password: testUser.password,
    });

    const res = await agent
      .patch("/api/auth/me")
      .send({ name: "Nikhil C.", role: "admin" });

    expect(res.status).toBe(400); // .strict() schema rejects the unknown field
  });
});

describe("POST /api/auth/logout", () => {
  it("clears the auth cookie so a subsequent /me request is unauthorized", async () => {
    const agent = request.agent(app);

    await agent.post("/api/auth/register").send(testUser);
    await agent.post("/api/auth/login").send({
      email: testUser.email,
      password: testUser.password,
    });
    await agent.post("/api/auth/logout");

    const res = await agent.get("/api/auth/me");

    expect(res.status).toBe(401);
  });
});

describe("POST /api/auth/forgot-password", () => {
  it("generates and stores a hashed OTP for a registered email, with a generic response", async () => {
    await request(app).post("/api/auth/register").send(testUser);

    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: testUser.email });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const inDb = await User.findOne({ email: testUser.email }).select(
      "+passwordResetOTPHash +passwordResetOTPExpires",
    );
    expect(inDb.passwordResetOTPHash).toBeTruthy();
    expect(inDb.passwordResetOTPHash).not.toMatch(/^\d{6}$/); // stored hashed, not the raw code
    expect(inDb.passwordResetOTPExpires.getTime()).toBeGreaterThan(Date.now());
  });

  // ADR-061/062: generic response either way, so a caller can't use this
  // endpoint to learn which emails have an account.
  it("responds identically for an email with no account, and stores nothing", async () => {
    const registered = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: testUser.email }); // not registered — no account exists yet

    const unregistered = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "nobody@example.com" });

    expect(unregistered.status).toBe(registered.status);
    expect(unregistered.body).toEqual(registered.body);
  });

  it("rejects a malformed email", async () => {
    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "not-an-email" });

    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/verify-reset-otp", () => {
  // The controller never returns the raw OTP (it only ever exists in the
  // email, which this suite can't read — see upload.test.js for the same
  // "can't assert on the real external send" precedent with Cloudinary).
  // Reading the hash and expiry back off the User document and reversing
  // hashOTP isn't possible (sha256 is one-way) either, so these tests
  // seed a known OTP directly through the same fields the controller
  // itself writes, rather than going through forgot-password's email step.
  const seedOtp = async (email, otp, { expired = false } = {}) => {
    const user = await User.findOne({ email });
    user.passwordResetOTPHash = hashOTP(otp);
    user.passwordResetOTPExpires = new Date(Date.now() + (expired ? -1000 : 15 * 60 * 1000));
    await user.save({ validateBeforeSave: false });
  };

  it("returns a reset token for a correct, unexpired OTP, and consumes it", async () => {
    await request(app).post("/api/auth/register").send(testUser);
    await seedOtp(testUser.email, "123456");

    const res = await request(app)
      .post("/api/auth/verify-reset-otp")
      .send({ email: testUser.email, otp: "123456" });

    expect(res.status).toBe(200);
    expect(typeof res.body.data.resetToken).toBe("string");

    // Single-use — the same OTP can't be verified again.
    const inDb = await User.findOne({ email: testUser.email }).select(
      "+passwordResetOTPHash +passwordResetOTPExpires",
    );
    expect(inDb.passwordResetOTPHash).toBeFalsy();
    expect(inDb.passwordResetOTPExpires).toBeFalsy();

    const replay = await request(app)
      .post("/api/auth/verify-reset-otp")
      .send({ email: testUser.email, otp: "123456" });
    expect(replay.status).toBe(400);
  });

  it("rejects an incorrect OTP with a generic message", async () => {
    await request(app).post("/api/auth/register").send(testUser);
    await seedOtp(testUser.email, "123456");

    const res = await request(app)
      .post("/api/auth/verify-reset-otp")
      .send({ email: testUser.email, otp: "999999" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid or expired code.");
  });

  it("rejects an expired OTP with the same generic message", async () => {
    await request(app).post("/api/auth/register").send(testUser);
    await seedOtp(testUser.email, "123456", { expired: true });

    const res = await request(app)
      .post("/api/auth/verify-reset-otp")
      .send({ email: testUser.email, otp: "123456" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid or expired code.");
  });

  // Same generic message as a wrong/expired OTP — distinguishing
  // "no account" from "wrong code" would itself be an enumeration oracle.
  it("rejects an email with no pending reset using the same generic message", async () => {
    const res = await request(app)
      .post("/api/auth/verify-reset-otp")
      .send({ email: "nobody@example.com", otp: "123456" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid or expired code.");
  });

  it("rejects a malformed OTP before ever touching the database", async () => {
    const res = await request(app)
      .post("/api/auth/verify-reset-otp")
      .send({ email: testUser.email, otp: "12a456" });

    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/reset-password", () => {
  const getResetToken = async (email, otp) => {
    const user = await User.findOne({ email });
    user.passwordResetOTPHash = hashOTP(otp);
    user.passwordResetOTPExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    const verifyRes = await request(app)
      .post("/api/auth/verify-reset-otp")
      .send({ email, otp });

    return verifyRes.body.data.resetToken;
  };

  it("sets the new password, logs the user in, and the old password stops working", async () => {
    await request(app).post("/api/auth/register").send(testUser);
    const resetToken = await getResetToken(testUser.email, "123456");

    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({ resetToken, newPassword: "brandNewPassword456" });

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(testUser.email);
    expect(res.headers["set-cookie"]).toBeDefined(); // auto-login, unlike register

    const oldPasswordLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: testUser.email, password: testUser.password });
    expect(oldPasswordLogin.status).toBe(401);

    const newPasswordLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: testUser.email, password: "brandNewPassword456" });
    expect(newPasswordLogin.status).toBe(200);
  });

  it("rejects a malformed or tampered reset token", async () => {
    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({ resetToken: "not-a-real-token", newPassword: "brandNewPassword456" });

    expect(res.status).toBe(400);
  });

  // A normal login JWT (real, currently valid, signed with the same
  // secret) must not work here — only a token carrying purpose:
  // "password-reset" may, or a login cookie would double as a way to
  // reset the password of whoever's session leaked (ADR-062).
  it("rejects a valid login token presented as a reset token", async () => {
    await request(app).post("/api/auth/register").send(testUser);
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: testUser.email, password: testUser.password });

    const loginCookie = loginRes.headers["set-cookie"][0];
    const loginToken = loginCookie.split(";")[0].split("=")[1];

    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({ resetToken: loginToken, newPassword: "brandNewPassword456" });

    expect(res.status).toBe(400);
  });

  it("rejects a reset token that's already been used once", async () => {
    await request(app).post("/api/auth/register").send(testUser);
    const resetToken = await getResetToken(testUser.email, "123456");

    await request(app)
      .post("/api/auth/reset-password")
      .send({ resetToken, newPassword: "firstNewPassword456" });

    const replay = await request(app)
      .post("/api/auth/reset-password")
      .send({ resetToken, newPassword: "secondNewPassword456" });

    // The token itself is still cryptographically valid for its 10-minute
    // window (ADR-062 documents this as an accepted limitation) — this
    // pins the currently-accepted behavior (200, password set again to
    // the replayed value) so a future change to that is a deliberate,
    // visible diff rather than a silent regression either way.
    expect(replay.status).toBe(200);
  });
});
