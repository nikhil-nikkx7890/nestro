import express from "express";
import {
  createMaterial,
  deleteMaterial,
  getAllMaterials,
  getMaterialById,
  updateMaterial,
} from "../controllers/material.controller.js";
import { validateObjectId } from "../middlewares/validateObjectId.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { materialSchema } from "../validators/material.validator.js";

const router = express.Router();
router
  .route("/")
  .get(getAllMaterials)
  .post(validateRequest(materialSchema), createMaterial);

router
  .route("/:materialId")
  .get(validateObjectId("materialId"), getMaterialById)
  .put(
    validateObjectId("materialId"),
    validateRequest(materialSchema),
    updateMaterial,
  )
  .delete(validateObjectId("materialId"), deleteMaterial);

export default router;
