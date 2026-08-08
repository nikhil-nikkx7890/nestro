import express from "express";
import {
  createBrand,
  deleteBrand,
  getAllBrands,
  getBrandById,
  updateBrand,
} from "../controllers/brand.controller.js";
import { validateObjectId } from "../middlewares/validateObjectId.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { brandSchema } from "../validators/brand.validator.js";

const router = express.Router();
router
  .route("/")
  .get(getAllBrands)
  .post(validateRequest(brandSchema), createBrand);

router
  .route("/:brandId")
  .get(validateObjectId("brandId"), getBrandById)
  .put(validateObjectId("brandId"), validateRequest(brandSchema), updateBrand)
  .delete(validateObjectId("brandId"), deleteBrand);

export default router;
