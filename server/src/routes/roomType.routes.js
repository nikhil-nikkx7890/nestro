import express from "express";
import {
    createRoomType,
    deleteRoomType,
    getAllRoomTypes,
    getRoomTypeById,
    updateRoomType
} from "../controllers/roomType.controller.js";
import {validateObjectId} from "../middlewares/validateObjectId.js";


const router = express.Router();

router
    .route("/")
    .post(createRoomType)
    .get(getAllRoomTypes)

router
    .route("/:roomTypeId")
    .get(validateObjectId("roomTypeId"), getRoomTypeById)
    .put(validateObjectId("roomTypeId"), updateRoomType)
    .delete(validateObjectId("roomTypeId"), deleteRoomType)

export default router;