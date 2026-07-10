import express from "express";
import {
  createAssessment,
  getAssessments,
  getAssessment,
  updateAssessment,
  deleteAssessment,
} from "./assessments.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/authorization.middleware.js";

const router = express.Router();

router.post("/", protect, authorize("ADMIN"), createAssessment);
router.get("/", protect, authorize("ADMIN", "TEACHER"), getAssessments);
router.get("/:id", protect, authorize("ADMIN", "TEACHER"), getAssessment);
router.put("/:id", protect, authorize("ADMIN"), updateAssessment);
router.delete("/:id", protect, authorize("ADMIN"), deleteAssessment);

export default router;
