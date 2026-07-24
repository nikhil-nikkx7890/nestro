import express from "express";
import { createCategory ,deleteCategory,getCategories, updateCategory } from "../controllers/category.controller.js";


const router = express.Router();
router
    .route("/")
    .post(createCategory)
    .get(getCategories);

router
    .route("/:categoryId")
    .put(updateCategory)
    .delete(deleteCategory)

export default router;