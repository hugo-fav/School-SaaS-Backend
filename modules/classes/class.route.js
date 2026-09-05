import express from "express";
import {
  createClass,
  getClasses,
  getClass,
  updateClass,
  deleteClass,
  enrollStudentInClass,
  getClassWithMembers,
} from "./class.controller.js";
import {
  validateCreateClass,
  validateUpdateClass,
  validateEnrollStudent,
} from "./class.validation.js";
import { protect } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/authorization.middleware.js";

const router = express.Router();

router.post("/", protect, authorize("ADMIN"), validateCreateClass, createClass);
router.get("/", protect, authorize("ADMIN"), getClasses);
router.get("/:id", protect, authorize("ADMIN", "TEACHER"), getClass);
router.put(
  "/:id",
  protect,
  authorize("ADMIN"),
  validateUpdateClass,
  updateClass,
);
router.delete("/:id", protect, authorize("ADMIN"), deleteClass);

router.post(
  "/:classId/enroll-student",
  protect,
  authorize("ADMIN"),
  validateEnrollStudent,
  enrollStudentInClass,
);

router.get(
  "/:id/members",
  protect,
  authorize("ADMIN", "TEACHER"),
  getClassWithMembers,
);

export default router;
s;
