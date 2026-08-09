import express from "express";
import upload from "../middlewares/upload.js";
import { uploadImage } from "../controllers/upload.controller.js";

const router = express.Router();

router.post("/image", upload.single("image"), uploadImage);

export default router;
