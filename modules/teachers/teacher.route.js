import express from "express";

import {
  createTeacher,
  getTeachers,
  getTeacher,
  updateTeacher,
  deleteTeacher,
  getMyProfile,
  getMyClasses,
  getMyStudents,
  getMySubjects,
  getStudentsByTeacherSubject,
} from "./teacher.controller.js";

import {
  validateCreateTeacher,
  validateUpdateTeacher,
} from "./teacher.validation.js";

import { protect } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/authorization.middleware.js";

const router = express.Router();

router.post(
  "/",
  protect,
  authorize("ADMIN"),
  validateCreateTeacher,
  createTeacher,
);

router.get("/me", protect, authorize("TEACHER"), getMyProfile);

router.get("/my-classes", protect, authorize("TEACHER"), getMyClasses);

router.get("/my-students", protect, authorize("TEACHER"), getMyStudents);

router.get("/my-subjects", protect, authorize("TEACHER"), getMySubjects);

router.get(
  "/my-subjects/:teacherSubjectId/students",
  protect,
  authorize("TEACHER"),
  getStudentsByTeacherSubject,
);

router.get("/", protect, authorize("ADMIN"), getTeachers);

router.get("/:id", protect, authorize("ADMIN"), getTeacher);

router.put(
  "/:id",
  protect,
  authorize("ADMIN"),
  validateUpdateTeacher,
  updateTeacher,
);

router.delete("/:id", protect, authorize("ADMIN"), deleteTeacher);

export default router;
