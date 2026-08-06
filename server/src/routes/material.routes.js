import express from "express";
import {
  createMaterial,
  deleteMaterial,
  getAllMaterials,
  getMaterialById,
  updateMaterial,
} from "../controllers/material.controller.js";
import { validateObjectId } from "../middlewares/validateObjectId.js";

const router = express.Router();
router.route("/").get(getAllMaterials).post(createMaterial);

router
  .route("/:materialId")
  .get(validateObjectId("materialId"), getMaterialById)
  .put(validateObjectId("materialId"), updateMaterial)
  .delete(validateObjectId("materialId"), deleteMaterial);

export default router;
