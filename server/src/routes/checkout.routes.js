import express from "express";
import { checkout } from "../controllers/order.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { checkoutSchema } from "../validators/order.validator.js";

const router = express.Router();

// Checkout is Customer-only, same gate as Cart/Wishlist/Addresses
// (ADR-037) — an admin has no cart or shipping address of their own to
// check out with in this app's model.
router.post("/", authenticate, authorize("customer"), validateRequest(checkoutSchema), checkout);

export default router;
