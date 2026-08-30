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
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";

const router = express.Router();

router
  .route("/")
  .post(
    authenticate,
    authorize("admin"),
    validateRequest(roomTypeSchema),
    createRoomType,
  )
  .get(getAllRoomTypes);

router
  .route("/:roomTypeId")
  .get(validateObjectId("roomTypeId"), getRoomTypeById)
  .put(
    authenticate,
    authorize("admin"),
    validateObjectId("roomTypeId"),
    validateRequest(roomTypeSchema),
    updateRoomType,
  )
  .delete(
    authenticate,
    authorize("admin"),
    validateObjectId("roomTypeId"),
    deleteRoomType,
  );

export default router;
