import express from "express";
import { createContactSubmission } from "../controllers/contact.controller.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { contactSchema } from "../validators/contact.validator.js";

const router = express.Router();

router.post("/", validateRequest(contactSchema), createContactSubmission);

export default router;
