import crypto from "node:crypto";

/**
 * 6-digit OTP for password reset (ADR-062). crypto.randomInt, not
 * Math.random — Math.random is not cryptographically secure, and a
 * predictable OTP would defeat the whole point of emailing one.
 * Zero-padded so 000042 stays six digits instead of becoming "42".
 */
export const generateOTP = () => {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
};

/**
 * Stored on the User as passwordResetOTPHash instead of the raw code, so
 * a database read (a backup, a stray log, an injection bug elsewhere)
 * doesn't hand over a working code directly — same reasoning as hashing
 * the password, just with sha256 rather than bcrypt.
 *
 * bcrypt is deliberately slow to make brute-forcing a *user-chosen*
 * password expensive across a huge keyspace. An OTP is the opposite
 * shape: system-generated, uniformly random, and already defended by
 * rate limiting (authLimiter) and a 15-minute expiry rather than hash
 * cost — sha256 is enough, and doesn't add ~100ms to every check.
 */
export const hashOTP = (otp) => {
  return crypto.createHash("sha256").update(otp).digest("hex");
};

/**
 * Constant-time comparison of a candidate OTP against the stored hash.
 * A naive `hashOTP(candidate) === storedHash` string comparison short-
 * circuits on the first mismatched character, which leaks (in theory,
 * over enough samples) how many leading hex characters were correct —
 * the same class of timing gap ADR-058 fixed on login. Both hashes are
 * fixed-length sha256 hex digests, so timingSafeEqual's equal-length
 * requirement is always satisfied.
 */
export const compareOTP = (candidate, storedHash) => {
  const candidateHash = Buffer.from(hashOTP(candidate), "hex");
  const stored = Buffer.from(storedHash, "hex");

  if (candidateHash.length !== stored.length) return false;
  return crypto.timingSafeEqual(candidateHash, stored);
};
