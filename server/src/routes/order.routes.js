import express from "express";
import {
  getOrders,
  getOrderById,
  cancelOrder,
  updateOrderStatus,
} from "../controllers/order.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { validateObjectId } from "../middlewares/validateObjectId.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { updateOrderStatusSchema } from "../validators/order.validator.js";

const router = express.Router();

router.use(authenticate);

// List and getById are shared between roles — the controller itself
// branches on req.user.role (own orders vs. every order), the same
// shape getProducts already uses for optionalAuthenticate, rather than
// two routes for what's conceptually one list at two visibility levels.
router.get("/", authorize("customer", "admin"), getOrders);
router.get("/:id", authorize("customer", "admin"), validateObjectId("id"), getOrderById);

router.post("/:id/cancel", authorize("customer"), validateObjectId("id"), cancelOrder);

router.patch(
  "/:id/status",
  authorize("admin"),
  validateObjectId("id"),
  validateRequest(updateOrderStatusSchema),
  updateOrderStatus,
);

export default router;
