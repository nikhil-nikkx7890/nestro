import express from "express";
import { handleRazorpayWebhook } from "../controllers/payment.controller.js";

const router = express.Router();

// express.raw() here, not the app-wide express.json() — signature
// verification needs the exact bytes Razorpay hashed, and this router is
// mounted in app.js before the global JSON parser specifically so that
// parser never touches this route's request stream first (ADR-067).
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  handleRazorpayWebhook,
);

export default router;
