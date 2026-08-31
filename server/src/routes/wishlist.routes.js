import express from "express";
import {
  getWishlist,
  addWishlistItem,
  removeWishlistItem,
} from "../controllers/wishlist.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { validateObjectId } from "../middlewares/validateObjectId.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { addWishlistItemSchema } from "../validators/wishlist.validator.js";

const router = express.Router();

// Wishlist is Customer-only (ADR-037), same as Cart.
router.use(authenticate, authorize("customer"));

router
  .route("/")
  .get(getWishlist);

router
  .route("/items")
  .post(validateRequest(addWishlistItemSchema), addWishlistItem);

router
  .route("/items/:productId")
  .delete(validateObjectId("productId"), removeWishlistItem);

export default router;
