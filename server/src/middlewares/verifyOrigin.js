import AppError from "../utils/AppError.js";

const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * CSRF guard, made necessary by authCookie.js's production sameSite:"none"
 * (required so the auth cookie survives a cross-site Vercel -> Render
 * fetch, but that also makes the browser send it on a request from ANY
 * site, not just ours). Rejects any state-changing request whose Origin
 * header doesn't match a known frontend origin.
 *
 * Only checks requests that carry an Origin header — browsers attach it
 * automatically on cross-site requests and can't be scripted to fake it,
 * so its absence just means a same-origin browser request or a
 * non-browser client (curl, Postman, the test suite), neither of which
 * this is meant to catch.
 */
export const verifyOrigin = (allowedOrigins) => (req, res, next) => {
  if (!WRITE_METHODS.has(req.method)) return next();

  const origin = req.headers.origin;
  if (!origin) return next();

  if (!allowedOrigins.includes(origin)) {
    throw new AppError("Request blocked: origin not allowed.", 403);
  }

  next();
};
