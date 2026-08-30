import express from "express";
import upload from "../middlewares/upload.js";
import { uploadImage } from "../controllers/upload.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";

const router = express.Router();

router.post(
  "/image",
  authenticate,
  authorize("admin"),
  upload.single("image"),
  uploadImage,
);

export default router;
