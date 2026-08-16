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

const router = express.Router();

// Nested under Product — create needs product context, listing is scoped to one product
router
  .route("/products/:productId/variants")
  .post(
    validateObjectId("productId"),
    validateRequest(productVariantSchema),
    createProductVariant,
  )
  .get(validateObjectId("productId"), getVariantsByProduct);

// Flat — a variant has its own _id, no need to repeat product context
router
  .route("/variants/:variantId")
  .get(validateObjectId("variantId"), getVariantById)
  .put(
    validateObjectId("variantId"),
    validateRequest(productVariantSchema),
    updateProductVariant,
  )
  .delete(validateObjectId("variantId"), deleteProductVariant);

export default router;
