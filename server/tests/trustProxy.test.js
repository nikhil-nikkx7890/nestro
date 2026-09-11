import request from "supertest";
import app from "../src/app.js";
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

/**
 * ADR-060: trust proxy must be 2 — Cloudflare, then Render's router — not
 * the 1 that ADR-058 set. This can't be asserted by reading req.ip directly
 * (nothing in the app exposes it), so it's asserted through the one thing
 * that actually depends on it in production: express-rate-limit's default
 * keyGenerator, which buckets by req.ip.
 *
 * Supertest connects over a real loopback TCP socket, so this exercises the
 * genuine trust-proxy resolution in app.js — X-Forwarded-For header, socket
 * hop, proxy-addr — not a mock of it. What it can't reproduce is Cloudflare
 * or Render actually being in front: the hop *count* (2) is asserted here;
 * that count corresponding to the real chain has to be re-checked against
 * production headers (Server: cloudflare, CF-RAY, rndr-id) after any
 * infrastructure change, which is exactly the gap ADR-058 and ADR-060 both
 * fell into. See "Verify after deploy" — this test cannot substitute for
 * that check.
 *
 * Two X-Forwarded-For entries stand in for the two real hops: the client's
 * address, then the Cloudflare edge address that forwards to Render's
 * router (the actual socket peer, ADR-060).
 */
describe("trust proxy (ADR-060)", () => {
  const asClient = (clientIp, edgeIp = "198.51.100.7") =>
    request(app)
      .get("/api/products/filter-options")
      .set("X-Forwarded-For", `${clientIp}, ${edgeIp}`);

  it("keys the rate limiter by the real client, not the shared edge address", async () => {
    // Two different simulated clients, behind the SAME simulated Cloudflare
    // edge. With trust proxy correctly counting both hops, each client's
    // first request lands on its own fresh counter — the two remaining
    // counts come back equal, not one lower than the other.
    const first = await asClient("203.0.113.5");
    const second = await asClient("203.0.113.9");

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);

    const firstRemaining = Number(first.headers["ratelimit-remaining"]);
    const secondRemaining = Number(second.headers["ratelimit-remaining"]);

    expect(firstRemaining).toBe(secondRemaining);

    // The regression this test would have caught: with trust proxy set to
    // 1 (ADR-058's value), both requests resolve to the shared edge
    // address, so the second request continues the first's counter
    // instead of starting its own — secondRemaining would be
    // firstRemaining - 1.
    expect(secondRemaining).not.toBe(firstRemaining - 1);
  });

  it("still keys repeat requests from the same client to the same counter", async () => {
    // Same simulated client hitting twice should decrement one shared
    // bucket — proving the key tracks the client consistently, not e.g. a
    // fresh key per request (which would hide the ADR-058 bug just as
    // effectively as collapsing everyone onto the edge address would).
    const first = await asClient("203.0.113.20");
    const second = await asClient("203.0.113.20");

    const firstRemaining = Number(first.headers["ratelimit-remaining"]);
    const secondRemaining = Number(second.headers["ratelimit-remaining"]);

    expect(secondRemaining).toBe(firstRemaining - 1);
  });
});
