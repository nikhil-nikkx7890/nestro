import crypto from "node:crypto";

/**
 * Verifies that a webhook payload genuinely came from Razorpay, not a
 * forged POST to this unauthenticated endpoint (ADR-067). Razorpay signs
 * the exact raw request bytes with HMAC-SHA256 using the webhook secret
 * configured in the Dashboard; recomputing that signature from the raw
 * body and comparing it constant-time is the same shape as `compareOTP`
 * in utils/otp.js, just verifying an HMAC instead of a hash.
 *
 * `rawBody` must be the untouched request bytes (a Buffer or the exact
 * string Razorpay hashed) — re-serializing a parsed JS object would not
 * reliably reproduce the same bytes (key order, spacing), which is why
 * the webhook route uses express.raw() instead of the app-wide
 * express.json().
 */
export const verifyWebhookSignature = (rawBody, signature, secret) => {
  if (!signature || !secret) return false;

  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");

  const expectedBuffer = Buffer.from(expected, "hex");
  const signatureBuffer = Buffer.from(signature, "hex");

  if (expectedBuffer.length !== signatureBuffer.length) return false;
  return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
};
