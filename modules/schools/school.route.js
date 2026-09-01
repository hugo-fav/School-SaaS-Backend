import express from "express";
import {
  createSchool,
  deleteSchool,
  getSchool,
  getSchools,
  updateSchool,
  updatePaymentSettings,
} from "./school.controller.js";

import { protect } from "../../middlewares/auth.middleware.js";
import { validatePaymentSettings } from "./school.validation.js";
import { authorize } from "../../middlewares/authorization.middleware.js";

const router = express.Router();

router.post("/", protect, createSchool);
router.get("/", protect, getSchools);
router.put(
  "/payment-settings",
  protect,
  authorize("ADMIN"),
  validatePaymentSettings,
  updatePaymentSettings,
);

router.get("/:id", protect, getSchool);
router.put("/:id", protect, updateSchool);
router.delete("/:id", protect, deleteSchool);

export default router;
