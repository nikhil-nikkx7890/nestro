import express from "express";

import {
  createColor,
  deleteColor,
  getAllColors,
  getColorById,
  updateColor,
} from "../controllers/color.controller.js";

import { validateObjectId } from "../middlewares/validateObjectId.js";

const router = express.Router();

router.route("/").get(getAllColors).post(createColor);

router
  .route("/:colorId")
  .get(validateObjectId("colorId"), getColorById)
  .put(validateObjectId("colorId"), updateColor)
  .delete(validateObjectId("colorId"), deleteColor);

export default router;
