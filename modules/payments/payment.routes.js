import express from "express";

import {
  initializePaymentController,
  verifyPaymentController,
  getPaymentHistoryController,
} from "./payment.controller.js";

import {
  validateInitializePayment,
  validateVerifyPayment,
  validatePaymentHistory,
} from "./payment.validation.js";

import { protect } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/authorization.middleware.js";

const router = express.Router();

// INITIALIZE PAYMENT
// STUDENT ONLY

router.post(
  "/initialize",
  protect,
  authorize("STUDENT"),
  validateInitializePayment,
  initializePaymentController,
);

// ADMIN: PAYMENT HISTORY

router.get(
  "/history",
  protect,
  authorize("ADMIN"),
  validatePaymentHistory,
  getPaymentHistoryController,
);

// VERIFY PAYMENT
// ADMIN + STUDENT

router.get(
  "/verify/:reference",
  protect,
  authorize("ADMIN", "STUDENT"),
  validateVerifyPayment,
  verifyPaymentController,
);

export default router;
