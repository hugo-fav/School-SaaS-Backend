import express from "express";
import {
  getMySchool,
  updateMySchool,
  deactivateMySchool,
  updatePaymentSettings,
} from "./school.controller.js";

import { protect } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/authorization.middleware.js";
import {
  validateUpdateSchool,
  validatePaymentSettings,
} from "./school.validation.js";

const router = express.Router();

router.get("/me", protect, authorize("ADMIN"), getMySchool);
router.put(
  "/me",
  protect,
  authorize("ADMIN"),
  validateUpdateSchool,
  updateMySchool,
);
router.delete("/me", protect, authorize("ADMIN"), deactivateMySchool);

router.put(
  "/payment-settings",
  protect,
  authorize("ADMIN"),
  validatePaymentSettings,
  updatePaymentSettings,
);

export default router;
