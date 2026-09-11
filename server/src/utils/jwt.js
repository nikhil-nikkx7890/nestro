import jwt from "jsonwebtoken";

/**
 * Signs a new JWT containing only the user's id. Kept minimal on purpose —
 * role and other details are fetched fresh from the database on every
 * request (see authenticate.js), so a role change takes effect immediately
 * instead of waiting for the old token to expire.
 */
export const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

/**
 * Short-lived token proving "this caller just verified a password-reset
 * OTP for this user", handed back by POST /api/auth/verify-reset-otp and
 * required by POST /api/auth/reset-password (ADR-062).
 *
 * Signed with the same JWT_SECRET as the login token but carries a
 * `purpose` claim so the two can never be used for each other — a normal
 * login cookie can't be replayed as a reset token, and a reset token
 * can't be presented to `authenticate` as a login session.
 *
 * 10 minutes: long enough to type a new password, short enough that a
 * token sitting in browser history or a proxy log is stale by the time
 * anyone could reuse it. Independent of the OTP's own 15-minute expiry
 * (utils/otp.js) — that one gates the emailed code, this one gates the
 * token issued *after* the code is already spent.
 */
export const generateResetToken = (userId) => {
  return jwt.sign({ userId, purpose: "password-reset" }, process.env.JWT_SECRET, {
    expiresIn: "10m",
  });
};

/**
 * Verifies a reset token and rejects anything that isn't one — including
 * a well-formed, currently-valid *login* token, which would otherwise
 * pass jwt.verify() cleanly since both are signed with the same secret.
 * Throws (jwt.verify's own error, or this one) on any failure; callers
 * catch and respond with one generic message either way.
 */
export const verifyResetToken = (token) => {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  if (decoded.purpose !== "password-reset") {
    throw new Error("Not a password-reset token.");
  }

  return decoded;
};
