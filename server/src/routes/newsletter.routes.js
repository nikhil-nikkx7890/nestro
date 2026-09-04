import express from "express";
import { subscribeToNewsletter } from "../controllers/newsletter.controller.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { newsletterSchema } from "../validators/newsletter.validator.js";

const router = express.Router();

router.post("/", validateRequest(newsletterSchema), subscribeToNewsletter);

export default router;
