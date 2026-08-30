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
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";

const router = express.Router();
router
  .route("/")
  .get(getAllBrands)
  .post(
    authenticate,
    authorize("admin"),
    validateRequest(brandSchema),
    createBrand,
  );

router
  .route("/:brandId")
  .get(validateObjectId("brandId"), getBrandById)
  .put(
    authenticate,
    authorize("admin"),
    validateObjectId("brandId"),
    validateRequest(brandSchema),
    updateBrand,
  )
  .delete(
    authenticate,
    authorize("admin"),
    validateObjectId("brandId"),
    deleteBrand,
  );

export default router;
