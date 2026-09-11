import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import AppError from "../utils/AppError.js";
import {
  generateToken,
  generateResetToken,
  verifyResetToken,
  generateEmailVerificationToken,
  verifyEmailVerificationToken,
} from "../utils/jwt.js";
import { authCookieOptions } from "../utils/authCookie.js";
import { generateOTP, hashOTP, compareOTP } from "../utils/otp.js";
import { sendEmail } from "../utils/email.js";
import {
  welcomeAndVerifyEmail,
  verificationEmail,
  accountAlreadyExistsEmail,
  passwordResetOTPEmail,
} from "../utils/emailTemplates.js";

// ADR-063's link points at a frontend page (/verify-email/:token), which
// calls GET /api/auth/verify-email/:token itself — the same "frontend
// page wraps the backend call" shape every other multi-step auth flow in
// this app already uses, rather than the email linking straight at the
// API and expecting a JSON response to double as a landing page.
const buildVerifyEmailUrl = (token) => `${process.env.CLIENT_URL}/verify-email/${token}`;

const OTP_EXPIRY_MS = 15 * 60 * 1000;

/**
 * A real bcrypt hash of a value nothing can log in with, compared against
 * when no user matches so that both branches of login pay the same cost
 * (ADR-058). Generated at cost 10, matching user.model.js's pre-save hook —
 * a cheaper hash here would leave a smaller but still measurable gap.
 *
 * Hardcoded rather than hashed at boot: it must be a constant so the work
 * is identical on every request, and it is not a credential — no account
 * has this hash, and comparing against it always fails.
 */
const DUMMY_PASSWORD_HASH =
  "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

/**
 * Publicly self-registers a new account. Always creates role: "customer" —
 * a public endpoint must never let the caller choose their own role, or
 * anyone could POST role: "admin" and grant themselves full access.
 * Admin accounts are created separately (seed script or by an existing
 * admin), never through this route.
 *
 * Constant-response (ADR-062, closing ADR-058 Finding 1): whether the
 * email is new or already registered, the HTTP response is byte-identical
 * — same status, same message, no Set-Cookie either way — so a caller
 * with no access to the mailbox can't tell which branch ran. The
 * difference between "welcome" and "you already have an account" is
 * carried entirely in the email sent to the real owner, exactly the
 * "check your email" resolution ADR-058 described as the fix once email
 * infrastructure existed.
 *
 * This is why register no longer auto-logs-in via cookie the way it used
 * to: setting a cookie only on the "new account" branch would itself be
 * the oracle (an attacker doesn't need to read the body if Set-Cookie's
 * presence alone answers the question). A newly created account is fully
 * usable immediately — the user just signs in separately afterwards,
 * the same as any returning user would.
 *
 * The "existing email" branch still does a same-cost bcrypt hash of the
 * submitted password (discarded) so it doesn't finish measurably faster
 * than the "new account" branch's real hash — the same proportionate,
 * dominant-cost timing fix login's DUMMY_PASSWORD_HASH already applies.
 * It does not attempt to match the one extra Mongo write the "new
 * account" branch performs; that gap is smaller than bcrypt's by roughly
 * an order of magnitude and noisier over a network round trip, so it's
 * accepted rather than chased with a fabricated dummy write.
 */
export const register = async (req, res) => {
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    await bcrypt.hash(password, 10);
    sendEmail({
      to: existingUser.email,
      ...accountAlreadyExistsEmail(existingUser.name),
    }).catch((err) => console.error("Failed to send 'account exists' email:", err));
  } else {
    const user = await User.create({ name, email, password, role: "customer" });

    // Verify-but-don't-block (ADR-063): the account above is already
    // fully created and usable — this token only controls the banner on
    // the account page, never login or anything else the account can do.
    const verifyToken = generateEmailVerificationToken(user._id);
    sendEmail({
      to: user.email,
      ...welcomeAndVerifyEmail(user.name, buildVerifyEmailUrl(verifyToken)),
    }).catch((err) => console.error("Failed to send welcome/verify email:", err));
  }

  return res.status(200).json({
    success: true,
    message:
      "If this email is available, your account has been created. Please sign in to continue.",
  });
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  // .select("+password") is required — the schema excludes password by
  // default (see user.model.js), so without this the hash wouldn't be on
  // the returned document and comparePassword would have nothing to compare against.
  const user = await User.findOne({ email }).select("+password");

  // Deliberately the same error message whether the email doesn't exist
  // or the password is wrong — a different message for each would let an
  // attacker enumerate which emails have accounts.
  //
  // The message alone wasn't enough. `!user || !(await user.compare...)`
  // short-circuits, so an unknown email skipped bcrypt entirely and
  // returned ~16x faster than a known one — the constant message defeated
  // by non-constant time (ADR-058). Comparing against a fixed dummy hash
  // on the no-user path makes both branches do the same work.
  const passwordMatches = user
    ? await user.comparePassword(password)
    : await bcrypt.compare(password, DUMMY_PASSWORD_HASH);

  if (!user || !passwordMatches) {
    throw new AppError("Invalid email or password.", 401);
  }

  if (!user.isActive) {
    throw new AppError("This account has been deactivated.", 403);
  }

  const token = generateToken(user._id);
  res.cookie("token", token, authCookieOptions);

  return res.status(200).json({
    success: true,
    message: "Logged in successfully",
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
    },
  });
};

export const logout = async (req, res) => {
  // clearCookie needs the same httpOnly/secure/sameSite options used when
  // the cookie was set, or the browser won't recognize it as the same
  // cookie and won't remove it.
  res.clearCookie("token", authCookieOptions);

  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

/**
 * Returns the currently logged-in user. Relies entirely on the
 * authenticate middleware having already run and attached req.user —
 * this controller does no lookup of its own.
 */
export const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    data: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      isEmailVerified: req.user.isEmailVerified,
    },
  });
};

/**
 * Updates the logged-in user's own name. req.user comes from the
 * authenticate middleware, so there's no id in the route — a caller can
 * only ever edit themselves, never another user.
 */
export const updateMe = async (req, res) => {
  const { name } = req.body;

  req.user.name = name;
  await req.user.save();

  return res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      isEmailVerified: req.user.isEmailVerified,
    },
  });
};

// --- Password reset, 3-step OTP flow (ADR-061, ADR-062) ---
//
// Split into three endpoints — request, verify, reset — rather than
// verifying the OTP and setting the password in one call, specifically
// so OTP-guessing can sit behind its own rate-limited endpoint separate
// from the final password-set call (ADR-061). All three share authLimiter
// with login/register (see auth.routes.js).

/**
 * Step 1. Always responds with the same generic message regardless of
 * whether the email has an account — the identical enumeration problem
 * ADR-058 found on register, addressed the same way from the start here
 * (ADR-061 required this be "generic response either way" from the first
 * commit, rather than deferred like register's fix was).
 *
 * The unmatched-email branch does no equivalent-cost filler work the way
 * register's does. The dominant cost here is a bcrypt-scale hash either
 * way (none) — hashOTP is sha256, sub-millisecond — so the real timing
 * signal, if any, is the one extra Mongo write the matched branch performs.
 * That gap is accepted rather than chased with a fabricated write, same
 * reasoning as register's comment above.
 */
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (user) {
    const otp = generateOTP();
    user.passwordResetOTPHash = hashOTP(otp);
    user.passwordResetOTPExpires = new Date(Date.now() + OTP_EXPIRY_MS);
    await user.save({ validateBeforeSave: false });

    sendEmail({ to: user.email, ...passwordResetOTPEmail(otp) }).catch((err) =>
      console.error("Failed to send password reset OTP email:", err),
    );
  }

  return res.status(200).json({
    success: true,
    message: "If an account exists for this email, a reset code has been sent.",
  });
};

/**
 * Step 2. Checks the submitted code against the stored hash and expiry.
 * One generic failure message covers "no such email", "wrong code", and
 * "expired code" alike — distinguishing them would let a caller learn
 * which emails have a pending reset without ever having read the actual
 * code from that inbox, a narrower version of the same oracle problem.
 *
 * On success the OTP is immediately cleared (single-use) and a
 * short-lived reset token is issued — from here on, that token is what
 * carries the flow to step 3, not the OTP.
 */
export const verifyResetOtp = async (req, res) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email }).select(
    "+passwordResetOTPHash +passwordResetOTPExpires",
  );

  const otpIsValid =
    user &&
    user.passwordResetOTPHash &&
    user.passwordResetOTPExpires &&
    user.passwordResetOTPExpires.getTime() > Date.now() &&
    compareOTP(otp, user.passwordResetOTPHash);

  if (!otpIsValid) {
    throw new AppError("Invalid or expired code.", 400);
  }

  user.passwordResetOTPHash = undefined;
  user.passwordResetOTPExpires = undefined;
  await user.save({ validateBeforeSave: false });

  const resetToken = generateResetToken(user._id);

  return res.status(200).json({
    success: true,
    message: "Code verified.",
    data: { resetToken },
  });
};

/**
 * Step 3. The resetToken already proves the caller verified a real OTP
 * for a real user (step 2) — unlike register/forgotPassword, there's no
 * enumeration concern left to guard here, so this responds like login
 * does on success: sets the auth cookie and signs the user in directly,
 * since they've already proven mailbox ownership more strongly than a
 * plain login does.
 */
export const resetPassword = async (req, res) => {
  const { resetToken, newPassword } = req.body;

  let decoded;
  try {
    decoded = verifyResetToken(resetToken);
  } catch {
    throw new AppError("This reset link has expired or is invalid. Please start over.", 400);
  }

  const user = await User.findById(decoded.userId);
  if (!user) {
    throw new AppError("This reset link has expired or is invalid. Please start over.", 400);
  }

  user.password = newPassword; // pre-save hook re-hashes, isModified("password") is true
  await user.save();

  const token = generateToken(user._id);
  res.cookie("token", token, authCookieOptions);

  return res.status(200).json({
    success: true,
    message: "Password reset successfully.",
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
    },
  });
};

// --- Email verification, verify-but-don't-block (ADR-063) ---

/**
 * GET /api/auth/verify-email/:token. Unlike the password-reset token,
 * there's no "consumed" state to clear here — verifying is idempotent by
 * design (ADR-063: a stale or reused verification link carries no
 * account-takeover risk the way a reused reset token would), so setting
 * an already-true isEmailVerified again is a harmless no-op rather than
 * something that needs guarding against. That also means an email
 * client's link-preview bot pre-fetching this URL can't lock a real user
 * out of verifying — it just verifies a little early.
 *
 * No auth required — clicking an emailed link isn't expected to happen
 * from an active session, and the token itself is what's being trusted,
 * the same as the reset-password token.
 */
export const verifyEmail = async (req, res) => {
  const { token } = req.params;

  let decoded;
  try {
    decoded = verifyEmailVerificationToken(token);
  } catch {
    throw new AppError(
      "This verification link has expired or is invalid. You can request a new one from your account page.",
      400,
    );
  }

  const user = await User.findById(decoded.userId);
  if (!user) {
    throw new AppError(
      "This verification link has expired or is invalid. You can request a new one from your account page.",
      400,
    );
  }

  if (!user.isEmailVerified) {
    user.isEmailVerified = true;
    await user.save({ validateBeforeSave: false });
  }

  return res.status(200).json({
    success: true,
    message: "Email verified.",
  });
};

/**
 * POST /api/auth/resend-verification-email. Authenticated and scoped to
 * req.user — unlike forgotPassword, there's no email-in-body lookup and
 * therefore no enumeration surface to guard against: only an
 * already-logged-in account can trigger a resend for itself.
 *
 * Already-verified is treated as a benign no-op success rather than an
 * error — the account page only shows the resend button when
 * !isEmailVerified in the first place, so reaching this branch mainly
 * means a stale tab or a race with another verification, not a caller
 * doing anything wrong.
 */
export const resendVerificationEmail = async (req, res) => {
  if (req.user.isEmailVerified) {
    return res.status(200).json({
      success: true,
      message: "This email is already verified.",
    });
  }

  const verifyToken = generateEmailVerificationToken(req.user._id);
  sendEmail({
    to: req.user.email,
    ...verificationEmail(req.user.name, buildVerifyEmailUrl(verifyToken)),
  }).catch((err) => console.error("Failed to send verification email:", err));

  return res.status(200).json({
    success: true,
    message: "Verification email sent.",
  });
};
