import jwt from "jsonwebtoken";

/**
 * Signs a new JWT containing only the user's id — no `purpose` claim,
 * unlike the reset/verification tokens below. That absence is what
 * `verifyLoginToken` checks for: a login token never has one, so
 * anything that does is a different kind of token entirely, not a
 * session (ADR-063).
 *
 * Kept minimal on purpose — role and other details are fetched fresh
 * from the database on every request (see authenticate.js), so a role
 * change takes effect immediately instead of waiting for the old token
 * to expire.
 */
export const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

/**
 * Verifies a genuine login/session token and rejects anything carrying a
 * `purpose` claim — a reset token or an email-verification token both
 * decode cleanly with plain `jwt.verify` (same secret), which would
 * otherwise let either one be presented as a full login session via the
 * `token` cookie `authenticate`/`optionalAuthenticate` read (ADR-063).
 *
 * That gap mattered more once the email-verification token existed: at
 * up to 24 hours, a leaked verification link is a far larger session-
 * hijack window than the reset token's 10 minutes ever was.
 */
export const verifyLoginToken = (token) => {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  if (decoded.purpose) {
    throw new Error("Not a login token.");
  }

  return decoded;
};

/**
 * Short-lived token proving "this caller just verified a password-reset
 * OTP for this user", handed back by POST /api/auth/verify-reset-otp and
 * required by POST /api/auth/reset-password (ADR-062).
 *
 * Signed with the same JWT_SECRET as the login token but carries a
 * `purpose` claim so the two can never be used for each other — a normal
 * login cookie can't be replayed as a reset token, and (via
 * verifyLoginToken above) a reset token can't be presented to
 * `authenticate` as a login session.
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

/**
 * Email verification link token (ADR-063). Same JWT-with-purpose-claim
 * shape as the reset token above, chosen for the same reason: it's
 * self-contained and tamper-proof, so nothing needs storing on the User
 * to track it — unlike the OTP flow, there's no separate "consumed"
 * state to track either, since verifying is idempotent (see
 * verifyEmail in auth.controller.js).
 *
 * 24 hours, not 10 minutes — ADR-063 chose this deliberately longer than
 * the reset token: verifying an email is lower-stakes and one-directional,
 * so there's no reason to force a same-sitting click the way a password
 * reset does. Long enough that checking email the next morning still
 * works; short enough that a stale, unused link doesn't stay valid
 * indefinitely. A resend endpoint covers the case where it does lapse.
 */
export const generateEmailVerificationToken = (userId) => {
  return jwt.sign({ userId, purpose: "email-verification" }, process.env.JWT_SECRET, {
    expiresIn: "24h",
  });
};

/**
 * Same rejection shape as verifyResetToken — a valid login or reset token
 * must not pass here just because it shares the same signing secret.
 */
export const verifyEmailVerificationToken = (token) => {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  if (decoded.purpose !== "email-verification") {
    throw new Error("Not an email-verification token.");
  }

  return decoded;
};
