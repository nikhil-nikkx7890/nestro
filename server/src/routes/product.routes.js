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
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";

const router = express.Router();

router
  .route("/")
  .post(
    authenticate,
    authorize("admin"),
    validateRequest(productSchema),
    createProduct,
  )
  .get(getProducts);

router
  .route("/:productId")
  .get(validateObjectId("productId"), getProductById)
  .put(
    authenticate,
    authorize("admin"),
    validateObjectId("productId"),
    validateRequest(productSchema),
    updateProduct,
  )
  .delete(
    authenticate,
    authorize("admin"),
    validateObjectId("productId"),
    deleteProduct,
  );

export default router;
