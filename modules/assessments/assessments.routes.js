import express from "express";
import {
  createAssessment,
  getAssessments,
  getAssessment,
  updateAssessment,
  deleteAssessment,
  publishAssessment,
  unpublishAssessment,
} from "./assessments.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/authorization.middleware.js";

const router = express.Router();

router.post("/", protect, authorize("ADMIN", "TEACHER"), createAssessment);
router.get("/", protect, authorize("ADMIN", "TEACHER"), getAssessments);
router.get("/:id", protect, authorize("ADMIN", "TEACHER"), getAssessment);
router.put("/:id", protect, authorize("ADMIN", "TEACHER"), updateAssessment);
router.delete("/:id", protect, authorize("ADMIN", "TEACHER"), deleteAssessment);
router.patch("/:id/publish", protect, authorize("ADMIN", "TEACHER"), publishAssessment)
router.patch("/:id/unpublish", protect, authorize("ADMIN", "TEACHER"), unpublishAssessment)

export default router;
