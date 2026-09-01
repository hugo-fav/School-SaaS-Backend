import express from "express";
import {
  createEnrollment,
  deleteEnrollment,
  getEnrollment,
  getEnrollments,
  updateEnrollment,
} from "./enrollments.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/authorization.middleware.js";

const router = express.Router();

router.post("/", protect, authorize("ADMIN"), createEnrollment);
router.get("/", protect, authorize("ADMIN", "TEACHER"), getEnrollments);
router.get("/:id", protect, authorize("ADMIN", "TEACHER"), getEnrollment);
router.put("/:id", protect, authorize("ADMIN", "TEACHER"), updateEnrollment);
router.delete("/:id", protect, authorize("ADMIN", "TEACHER"), deleteEnrollment);

export default router;
