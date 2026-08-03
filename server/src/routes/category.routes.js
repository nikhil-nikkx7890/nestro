import express from "express";
import { createCategory, deleteCategory, getCategories, updateCategory, getCategoryById } from "../controllers/category.controller.js";
import {validateObjectId} from "../middlewares/validateObjectId.js";


const router = express.Router();
router
    .route("/")
    .post(createCategory)
    .get(getCategories);

router
    .route("/:categoryId")
    .get(validateObjectId("categoryId") , getCategoryById)
    .put(validateObjectId("categoryId") , updateCategory)
    .delete(validateObjectId("categoryId") , deleteCategory)

export default router;