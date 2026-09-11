import express from "express";
import rateLimit from "express-rate-limit";
import {
  register,
  login,
  logout,
  getMe,
  updateMe,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  verifyEmail,
  resendVerificationEmail,
} from "../controllers/auth.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import {
  registerSchema,
  loginSchema,
  updateMeSchema,
  forgotPasswordSchema,
  verifyResetOtpSchema,
  resetPasswordSchema,
} from "../validators/auth.validator.js";

const router = express.Router();

// Tighter than the general apiLimiter in app.js — login/register (and now
// the password-reset trio below) are the specific routes a brute-force or
// credential-stuffing attempt would hit repeatedly, so they share their
// own stricter cap on top of the global one. verify-reset-otp in
// particular relies on this: 20 attempts/15min against a 6-digit code
// (1,000,000 possibilities) inside its own 15-minute expiry window caps
// guess success at 0.002% per code, without needing a separate limiter.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 20 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many attempts. Please try again later.",
  },
});

router.post("/register", authLimiter, validateRequest(registerSchema), register);
router.post("/login", authLimiter, validateRequest(loginSchema), login);
router.post("/logout", logout);
router.get("/me", authenticate, getMe);
router.patch("/me", authenticate, validateRequest(updateMeSchema), updateMe);

router.post(
  "/forgot-password",
  authLimiter,
  validateRequest(forgotPasswordSchema),
  forgotPassword,
);
router.post(
  "/verify-reset-otp",
  authLimiter,
  validateRequest(verifyResetOtpSchema),
  verifyResetOtp,
);
router.post(
  "/reset-password",
  authLimiter,
  validateRequest(resetPasswordSchema),
  resetPassword,
);

// Email verification (ADR-063). No validateRequest — :token is a JWT,
// not a Mongo ObjectId (validateObjectId doesn't fit), and the body-less
// resend request has nothing to validate. No authLimiter on the GET: the
// token is an unguessable signed JWT, not a value worth brute-forcing,
// so there's no abuse shape here the general apiLimiter doesn't already
// cover. The resend POST does share authLimiter — repeatedly triggering
// it is the same "spam this address" shape forgotPassword already sits
// behind it for.
router.get("/verify-email/:token", verifyEmail);
router.post("/resend-verification-email", authenticate, authLimiter, resendVerificationEmail);

export default router;
