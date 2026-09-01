import express from "express";

import {
  createFeeController,
  getFeesController,
  getFeeByIdController,
  updateFeeController,
  deleteFeeController,
} from "./fee.controller.js";

import {
  validateCreateFee,
  validateGetFees,
  validateUpdateFee,
} from "./fee.validation.js";

import { protect } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/authorization.middleware.js";

const router = express.Router();

// Create fee
router.post(
  "/",
  protect,
  authorize("ADMIN"),
  validateCreateFee,
  createFeeController,
);

// Get all fees / filter fees
router.get(
  "/",
  protect,
  authorize("ADMIN"),
  validateGetFees,
  getFeesController,
);

// Get single fee
router.get("/:id", protect, authorize("ADMIN"), getFeeByIdController);

// Update fee
router.put(
  "/:id",
  protect,
  authorize("ADMIN"),
  validateUpdateFee,
  updateFeeController,
);

// Delete fee
router.delete("/:id", protect, authorize("ADMIN"), deleteFeeController);

export default router;
