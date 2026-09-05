import express from "express";
import { getUsers, updateUserStatus } from "../controllers/user.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { validateObjectId } from "../middlewares/validateObjectId.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { updateUserStatusSchema } from "../validators/user.validator.js";

const router = express.Router();

// Admin-only throughout — this is the user directory, not a profile
// route. A customer managing their own account uses /api/auth/me.
router.use(authenticate, authorize("admin"));

router.get("/", getUsers);

router.patch(
  "/:userId/status",
  validateObjectId("userId"),
  validateRequest(updateUserStatusSchema),
  updateUserStatus,
);

export default router;
