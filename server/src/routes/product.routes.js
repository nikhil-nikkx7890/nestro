import express from "express";
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from "../controllers/product.controller.js";
import { validateObjectId } from "../middlewares/validateObjectId.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { productSchema } from "../validators/product.validator.js";

const router = express.Router();

router
  .route("/")
  .post(validateRequest(productSchema), createProduct)
  .get(getProducts);

router
  .route("/:productId")
  .get(validateObjectId("productId"), getProductById)
  .put(
    validateObjectId("productId"),
    validateRequest(productSchema),
    updateProduct,
  )
  .delete(validateObjectId("productId"), deleteProduct);

export default router;
