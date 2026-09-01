import express from "express";
import rateLimit from "express-rate-limit";
import { register, login, logout, getMe, updateMe } from "../controllers/auth.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { registerSchema, loginSchema, updateMeSchema } from "../validators/auth.validator.js";

const router = express.Router();

// Tighter than the general apiLimiter in app.js — login/register are the
// specific routes a brute-force or credential-stuffing attempt would hit
// repeatedly, so they get their own stricter cap on top of the global one.
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

export default router;
