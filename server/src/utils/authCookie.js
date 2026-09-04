/**
 * Shared cookie config for the auth token. Login sets it, logout clears
 * it — clearCookie only works reliably if the same httpOnly/secure/sameSite
 * options are passed both times, so this stays in one place rather than
 * being duplicated (and risking drift) across two controller functions.
 */
const isProduction = process.env.NODE_ENV === "production";

export const authCookieOptions = {
  httpOnly: true, // JavaScript on the page can never read this cookie (XSS protection)
  secure: isProduction, // HTTPS-only in production; allowed over plain http in local dev
  // "lax" works locally because the frontend/backend share a site (both
  // localhost). In production they're on different domains (Vercel +
  // Render), and "lax" silently drops the cookie on every cross-site
  // fetch/axios call — so the cookie must be "none" there. "none" requires
  // secure:true (browser policy) and reopens CSRF, which verifyOrigin
  // (see middlewares/verifyOrigin.js) covers instead.
  sameSite: isProduction ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days, in milliseconds — keep in sync with JWT_EXPIRES_IN
};
