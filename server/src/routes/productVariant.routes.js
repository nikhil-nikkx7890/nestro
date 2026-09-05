import express from "express";
import {
  createProductVariant,
  getVariantsByProduct,
  getVariantById,
  updateProductVariant,
  deleteProductVariant,
} from "../controllers/productVariant.controller.js";
import { validateObjectId } from "../middlewares/validateObjectId.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { productVariantSchema } from "../validators/productVariant.validator.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { optionalAuthenticate } from "../middlewares/optionalAuthenticate.js";

const router = express.Router();

// Nested under Product — create needs product context, listing is scoped to one product
router
  .route("/products/:productId/variants")
  .post(
    authenticate,
    authorize("admin"),
    validateObjectId("productId"),
    validateRequest(productVariantSchema),
    createProductVariant,
  )
  .get(optionalAuthenticate, validateObjectId("productId"), getVariantsByProduct);

// Flat — a variant has its own _id, no need to repeat product context
router
  .route("/variants/:variantId")
  // optionalAuthenticate, same as the sibling listing route above: the
  // controller needs to know whether the caller is an admin before it can
  // decide whether an unpublished product's variant is visible (ADR-058).
  .get(optionalAuthenticate, validateObjectId("variantId"), getVariantById)
  .put(
    authenticate,
    authorize("admin"),
    validateObjectId("variantId"),
    validateRequest(productVariantSchema),
    updateProductVariant,
  )
  .delete(
    authenticate,
    authorize("admin"),
    validateObjectId("variantId"),
    deleteProductVariant,
  );

export default router;
