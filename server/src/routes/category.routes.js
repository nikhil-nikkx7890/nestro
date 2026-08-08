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

const router = express.Router();
router
  .route("/")
  .post(validateRequest(categorySchema), createCategory)
  .get(getCategories);

router
  .route("/:categoryId")
  .get(validateObjectId("categoryId"), getCategoryById)
  .put(
    validateObjectId("categoryId"),
    validateRequest(categorySchema),
    updateCategory,
  )
  .delete(validateObjectId("categoryId"), deleteCategory);

export default router;
