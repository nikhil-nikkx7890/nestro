import { getResendClient } from "../config/resend.js";

/**
 * Sends one email via Resend. Same shape as searchUnsplashPhotos in
 * unsplash.js — throws a clear Error when the API key is missing or the
 * send itself fails, rather than swallowing it here. Every current
 * caller wraps its own call in .catch() (ADR-062): a failed send must
 * never fail the request that triggered it — register, forgot-password,
 * etc. all have to keep responding identically whether or not the email
 * actually goes out, both for the constant-response guarantee and
 * because Resend's sandbox domain can only deliver to the account
 * owner's own verified address (ADR-061) — every other recipient's send
 * is *expected* to fail until a real domain is verified.
 *
 * @param {{ to: string, subject: string, html: string }} params
 */
export const sendEmail = async ({ to, subject, html }) => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY is not set. Get a free key at resend.com and add it to server/.env",
    );
  }

  const from = process.env.RESEND_FROM || "onboarding@resend.dev";

  const { error } = await getResendClient().emails.send({ from, to, subject, html });

  if (error) {
    throw new Error(`Resend failed to send to ${to}: ${error.message || error}`);
  }
};
