import express from "express";

import {
  createStudent,
  deactivateStudent,
  getMyAttendance,
  getMyClasses,
  getMyProfile,
  getMyResults,
  getStudent,
  getStudents,
  updateStudent,
} from "./student.controller.js";

import {
  validateCreateStudent,
  validateUpdateStudent,
} from "./student.validation.js";

import { protect } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/authorization.middleware.js";

const router = express.Router();

router.post(
  "/",
  protect,
  authorize("ADMIN"),
  validateCreateStudent,
  createStudent,
);

router.get("/", protect, authorize("ADMIN", "TEACHER"), getStudents);

router.get("/me", protect, authorize("STUDENT"), getMyProfile);
router.get("/me/classes", protect, authorize("STUDENT"), getMyClasses);
router.get("/me/results", protect, authorize("STUDENT"), getMyResults);
router.get("/me/attendance", protect, authorize("STUDENT"), getMyAttendance);

router.get("/:id", protect, authorize("ADMIN", "TEACHER"), getStudent);
router.put(
  "/:id",
  protect,
  authorize("ADMIN"),
  validateUpdateStudent,
  updateStudent,
);
router.delete("/:id", protect, authorize("ADMIN"), deactivateStudent);

export default router;
