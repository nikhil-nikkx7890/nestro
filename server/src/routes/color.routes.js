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

const router = express.Router();

router
  .route("/")
  .get(getAllColors)
  .post(validateRequest(colorSchema), createColor);

router
  .route("/:colorId")
  .get(validateObjectId("colorId"), getColorById)
  .put(validateObjectId("colorId"), validateRequest(colorSchema), updateColor)
  .delete(validateObjectId("colorId"), deleteColor);

export default router;
