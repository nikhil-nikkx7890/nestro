/**
 * Plain HTML template functions rather than React Email (which ADR-061
 * floated as a reason to pick Resend). React Email would mean adding
 * react/react-dom and a render pipeline to an Express server that has
 * neither, for three small templates — not worth it yet. Revisit if the
 * template count or complexity grows enough to justify the dependency
 * (ADR-062).
 *
 * Each function returns { subject, html }. Inline styles only, no
 * external stylesheet or class names — most email clients strip both.
 */

const wrapper = (bodyHtml) => `
  <div style="font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif; background-color: #f5f5f4; padding: 32px 16px;">
    <div style="max-width: 480px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #e7e5e4;">
      <p style="margin: 0 0 24px; font-size: 20px; font-weight: 700; color: #1c1917;">Nestro</p>
      ${bodyHtml}
      <p style="margin: 32px 0 0; font-size: 12px; color: #a8a29e;">
        This is a demo store — Nestro is a portfolio project, not a real business. If you didn't expect this email, you can safely ignore it.
      </p>
    </div>
  </div>
`;

/**
 * Sent once, at registration. Combines the welcome message with the
 * verification link (ADR-063) rather than sending two separate emails —
 * a new account gets one message, not a "welcome" followed immediately
 * by a "now verify" as a second, near-duplicate send.
 */
export const welcomeAndVerifyEmail = (name, verifyUrl) => ({
  subject: "Welcome to Nestro — verify your email",
  html: wrapper(`
    <p style="margin: 0 0 16px; font-size: 16px; color: #1c1917;">Hi ${name},</p>
    <p style="margin: 0 0 16px; font-size: 15px; color: #44403c; line-height: 1.6;">
      Your Nestro account has been created. You can sign in right away — but take a moment to verify this email address too, so it's confirmed as yours.
    </p>
    <p style="margin: 0 0 16px; text-align: center;">
      <a href="${verifyUrl}" style="display: inline-block; padding: 12px 28px; background-color: #1c1917; color: #ffffff; border-radius: 8px; text-decoration: none; font-size: 15px; font-weight: 600;">
        Verify Email
      </a>
    </p>
    <p style="margin: 0; font-size: 13px; color: #78716c; line-height: 1.6;">
      This link expires in 24 hours. Verifying is optional — your account works either way — but you can always request a new link from your account page if this one lapses.
    </p>
  `),
});

/**
 * Sent by POST /api/auth/resend-verification-email (ADR-063) — same
 * content and shape as the verification half of welcomeAndVerifyEmail
 * above, without the welcome framing, since the account already exists.
 */
export const verificationEmail = (name, verifyUrl) => ({
  subject: "Verify your Nestro email",
  html: wrapper(`
    <p style="margin: 0 0 16px; font-size: 16px; color: #1c1917;">Hi ${name},</p>
    <p style="margin: 0 0 16px; font-size: 15px; color: #44403c; line-height: 1.6;">
      Here's a new link to verify your Nestro account's email address.
    </p>
    <p style="margin: 0 0 16px; text-align: center;">
      <a href="${verifyUrl}" style="display: inline-block; padding: 12px 28px; background-color: #1c1917; color: #ffffff; border-radius: 8px; text-decoration: none; font-size: 15px; font-weight: 600;">
        Verify Email
      </a>
    </p>
    <p style="margin: 0; font-size: 13px; color: #78716c; line-height: 1.6;">
      This link expires in 24 hours.
    </p>
  `),
});

export const accountAlreadyExistsEmail = (name) => ({
  subject: "Someone tried to register with your Nestro email",
  html: wrapper(`
    <p style="margin: 0 0 16px; font-size: 16px; color: #1c1917;">Hi ${name},</p>
    <p style="margin: 0 0 16px; font-size: 15px; color: #44403c; line-height: 1.6;">
      Someone just tried to create a new Nestro account using this email address, which already has one. If that was you, no action is needed — just sign in as usual, or reset your password if you've forgotten it.
    </p>
    <p style="margin: 0; font-size: 15px; color: #44403c; line-height: 1.6;">
      If it wasn't you, nothing has changed — no new account was created, and your existing one is unaffected.
    </p>
  `),
});

export const passwordResetOTPEmail = (otp) => ({
  subject: "Your Nestro password reset code",
  html: wrapper(`
    <p style="margin: 0 0 16px; font-size: 15px; color: #44403c; line-height: 1.6;">
      Use this code to reset your Nestro password. It expires in 15 minutes.
    </p>
    <p style="margin: 0 0 16px; font-size: 32px; font-weight: 700; letter-spacing: 0.15em; color: #1c1917; text-align: center; padding: 16px; background-color: #f5f5f4; border-radius: 8px;">
      ${otp}
    </p>
    <p style="margin: 0; font-size: 14px; color: #78716c; line-height: 1.6;">
      If you didn't request this, you can ignore this email — your password won't change unless this code is used.
    </p>
  `),
});
