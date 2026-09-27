import express from "express";
import {
  createEnrollment,
  deleteEnrollment,
  getEnrollment,
  getEnrollments,
  updateEnrollment,
} from "./enrollments.controller.js";
import {
  validateCreateEnrollment,
  validateUpdateEnrollment,
} from "./enrollments.validation.js";
import { protect } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/authorization.middleware.js";

const router = express.Router();

router.post(
  "/",
  protect,
  authorize("ADMIN"),
  validateCreateEnrollment,
  createEnrollment,
);

// NOTE: TEACHER can currently view/edit/delete ANY enrollment in the
// school — none of these three are scoped to the teacher's own
// TeacherSubject assignments (unlike getStudentsForTeacher elsewhere in
// the codebase). Worth confirming this is the intended policy before
// shipping; happy to add the same scoping pattern if not.
router.get("/", protect, authorize("ADMIN", "TEACHER"), getEnrollments);
router.get("/:id", protect, authorize("ADMIN", "TEACHER"), getEnrollment);

router.put(
  "/:id",
  protect,
  authorize("ADMIN", "TEACHER"),
  validateUpdateEnrollment,
  updateEnrollment,
);

router.delete("/:id", protect, authorize("ADMIN", "TEACHER"), deleteEnrollment);

export default router;
