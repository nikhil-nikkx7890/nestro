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
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";

const router = express.Router();
router
  .route("/")
  .get(getAllMaterials)
  .post(
    authenticate,
    authorize("admin"),
    validateRequest(materialSchema),
    createMaterial,
  );

router
  .route("/:materialId")
  .get(validateObjectId("materialId"), getMaterialById)
  .put(
    authenticate,
    authorize("admin"),
    validateObjectId("materialId"),
    validateRequest(materialSchema),
    updateMaterial,
  )
  .delete(
    authenticate,
    authorize("admin"),
    validateObjectId("materialId"),
    deleteMaterial,
  );

export default router;
