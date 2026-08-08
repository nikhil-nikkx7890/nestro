import express from "express";
import {
  createRoomType,
  deleteRoomType,
  getAllRoomTypes,
  getRoomTypeById,
  updateRoomType,
} from "../controllers/roomType.controller.js";
import { validateObjectId } from "../middlewares/validateObjectId.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { roomTypeSchema } from "../validators/roomType.validator.js";

const router = express.Router();

router
  .route("/")
  .post(validateRequest(roomTypeSchema), createRoomType)
  .get(getAllRoomTypes);

router
  .route("/:roomTypeId")
  .get(validateObjectId("roomTypeId"), getRoomTypeById)
  .put(
    validateObjectId("roomTypeId"),
    validateRequest(roomTypeSchema),
    updateRoomType,
  )
  .delete(validateObjectId("roomTypeId"), deleteRoomType);

export default router;
