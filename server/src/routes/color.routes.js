import express from "express";

import {
  createColor,
  deleteColor,
  getAllColors,
  getColorById,
  updateColor,
} from "../controllers/color.controller.js";

import { validateObjectId } from "../middlewares/validateObjectId.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { colorSchema } from "../validators/color.validator.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";

const router = express.Router();

router
  .route("/")
  .get(getAllColors)
  .post(
    authenticate,
    authorize("admin"),
    validateRequest(colorSchema),
    createColor,
  );

router
  .route("/:colorId")
  .get(validateObjectId("colorId"), getColorById)
  .put(
    authenticate,
    authorize("admin"),
    validateObjectId("colorId"),
    validateRequest(colorSchema),
    updateColor,
  )
  .delete(
    authenticate,
    authorize("admin"),
    validateObjectId("colorId"),
    deleteColor,
  );

export default router;
