import express from "express";
import {
  createTeacherSubject,
  getTeacherSubjects,
  getTeacherSubject,
  updateTeacherSubject,
  deleteTeacherSubject,
} from "./teacherSubjects.controller.js";
import {
  validateCreateTeacherSubject,
  validateUpdateTeacherSubject,
} from "./teacherSubject.validation.js";
import { protect } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/authorization.middleware.js";

const router = express.Router();

router.post(
  "/",
  protect,
  authorize("ADMIN"),
  validateCreateTeacherSubject,
  createTeacherSubject,
);
router.get("/", protect, authorize("ADMIN", "TEACHER"), getTeacherSubjects);
router.get("/:id", protect, authorize("ADMIN", "TEACHER"), getTeacherSubject);
router.put(
  "/:id",
  protect,
  authorize("ADMIN"),
  validateUpdateTeacherSubject,
  updateTeacherSubject,
);
router.delete("/:id", protect, authorize("ADMIN"), deleteTeacherSubject);

export default router;
