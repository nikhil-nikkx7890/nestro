import express from "express";
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
  getCategoryById,
} from "../controllers/category.controller.js";
import { validateObjectId } from "../middlewares/validateObjectId.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { categorySchema } from "../validators/category.validator.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";

const router = express.Router();
router
  .route("/")
  .post(
    authenticate,
    authorize("admin"),
    validateRequest(categorySchema),
    createCategory,
  )
  .get(getCategories);

router
  .route("/:categoryId")
  .get(validateObjectId("categoryId"), getCategoryById)
  .put(
    authenticate,
    authorize("admin"),
    validateObjectId("categoryId"),
    validateRequest(categorySchema),
    updateCategory,
  )
  .delete(
    authenticate,
    authorize("admin"),
    validateObjectId("categoryId"),
    deleteCategory,
  );

export default router;
