import express from "express";
import {
  getCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
} from "../controllers/cart.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { validateObjectId } from "../middlewares/validateObjectId.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { addCartItemSchema, updateCartItemSchema } from "../validators/cart.validator.js";

const router = express.Router();

// Cart is Customer-only (ADR-037) — a logged-in admin gets 403 here, same
// as authorize("customer") behaves on any other role-gated route.
router.use(authenticate, authorize("customer"));

router
  .route("/")
  .get(getCart);

router
  .route("/items")
  .post(validateRequest(addCartItemSchema), addCartItem);

router
  .route("/items/:variantId")
  .put(validateObjectId("variantId"), validateRequest(updateCartItemSchema), updateCartItem)
  .delete(validateObjectId("variantId"), removeCartItem);

export default router;
