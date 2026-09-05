import express from "express";
import {
  getProductReviews,
  getAllReviews,
  createReview,
  updateReview,
  deleteReview,
} from "../controllers/review.controller.js";
import { validateObjectId } from "../middlewares/validateObjectId.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { reviewSchema } from "../validators/review.validator.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { optionalAuthenticate } from "../middlewares/optionalAuthenticate.js";

const router = express.Router();

// Nested under Product for listing/creating — a review only exists in the
// context of one product, same shape as the variant routes.
router
  .route("/products/:productId/reviews")
  .get(optionalAuthenticate, validateObjectId("productId"), getProductReviews)
  .post(
    authenticate,
    authorize("customer"),
    validateObjectId("productId"),
    validateRequest(reviewSchema),
    createReview,
  );

// Admin-only moderation list across every product. Declared before the
// /reviews/:reviewId route so "reviews" is never read as an id.
router.get("/reviews", authenticate, authorize("admin"), getAllReviews);

// Flat for edit/delete — a review has its own _id. Only `authenticate`
// here, no authorize(): delete allows the owner OR an admin, which is an
// ownership rule the controller has to decide, not a role gate.
router
  .route("/reviews/:reviewId")
  .put(
    authenticate,
    authorize("customer"),
    validateObjectId("reviewId"),
    validateRequest(reviewSchema),
    updateReview,
  )
  .delete(authenticate, validateObjectId("reviewId"), deleteReview);

export default router;
