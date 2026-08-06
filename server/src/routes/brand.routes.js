import express from "express";
import {createBrand, deleteBrand, getAllBrands, getBrandById, updateBrand} from "../controllers/brand.controller.js";
import {validateObjectId} from "../middlewares/validateObjectId.js";

const router = express.Router();
router
.route("/")
.get(getAllBrands)
.post(createBrand)

router
.route("/:brandId")
.get(validateObjectId("brandId"), getBrandById)
.put(validateObjectId("brandId"), updateBrand)
.delete(validateObjectId("brandId"), deleteBrand)

export default router;