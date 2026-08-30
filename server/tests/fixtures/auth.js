import request from "supertest";
import app from "../../src/app.js";
import User from "../../src/models/user.model.js";

/**
 * Creates an admin user and logs them in, returning a supertest agent
 * that carries the auth cookie on every subsequent request — the same
 * agent pattern used in auth.test.js. Every Master Data / Product /
 * Variant test that hits a write route (POST/PUT/DELETE) now needs one
 * of these, since those routes require authenticate + authorize("admin")
 * per ADR-035.
 */
export const createAdminAgent = async () => {
  await User.create({
    name: "Test Admin",
    email: "admin@test.com",
    password: "testpassword123",
    role: "admin",
  });

  const agent = request.agent(app);
  await agent.post("/api/auth/login").send({
    email: "admin@test.com",
    password: "testpassword123",
  });

  return agent;
};

/**
 * Same idea, but role: "customer" — used to prove authorize("admin")
 * actually blocks a logged-in-but-wrong-role user (403), not just an
 * unauthenticated one (401).
 */
export const createCustomerAgent = async () => {
  await User.create({
    name: "Test Customer",
    email: "customer@test.com",
    password: "testpassword123",
    role: "customer",
  });

  const agent = request.agent(app);
  await agent.post("/api/auth/login").send({
    email: "customer@test.com",
    password: "testpassword123",
  });

  return agent;
};
