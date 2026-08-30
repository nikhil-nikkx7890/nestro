/**
 * Shared cookie config for the auth token. Login sets it, logout clears
 * it — clearCookie only works reliably if the same httpOnly/secure/sameSite
 * options are passed both times, so this stays in one place rather than
 * being duplicated (and risking drift) across two controller functions.
 */
export const authCookieOptions = {
  httpOnly: true, // JavaScript on the page can never read this cookie (XSS protection)
  secure: process.env.NODE_ENV === "production", // HTTPS-only in production; allowed over plain http in local dev
  sameSite: "lax", // sent on normal navigation/same-site requests, blocked on most cross-site ones (CSRF protection)
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days, in milliseconds — keep in sync with JWT_EXPIRES_IN
};
