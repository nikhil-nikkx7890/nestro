import express from "express";
import {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
} from "../controllers/address.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { validateObjectId } from "../middlewares/validateObjectId.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { addressSchema, updateAddressSchema } from "../validators/address.validator.js";

const router = express.Router();

// Addresses are Customer-only, same gate as Cart/Wishlist (ADR-037) — an
// admin has no personal shipping address in this app's model, the same
// reasoning that keeps Cart/Wishlist off the admin role.
router.use(authenticate, authorize("customer"));

router
  .route("/")
  .get(getAddresses)
  .post(validateRequest(addressSchema), createAddress);

router
  .route("/:id")
  .patch(validateObjectId("id"), validateRequest(updateAddressSchema), updateAddress)
  .delete(validateObjectId("id"), deleteAddress);

export default router;
