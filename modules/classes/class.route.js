import express from "express";
import {
  createClass,
  getClasses,
  getClass,
  updateClass,
  deleteClass,
  assignStudentToClass,
  assignTeacherToClass,
  getClassWithMembers,
} from "./class.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/authorization.middleware.js";

const router = express.Router();

router.post("/", protect, authorize("ADMIN"), createClass);
router.get("/", protect, authorize("ADMIN", "TEACHER"), getClasses);
router.get("/:id", protect, authorize("ADMIN", "TEACHER"), getClass);
router.put("/:id", protect, authorize("ADMIN"), updateClass);
router.delete("/:id", protect, authorize("ADMIN"), deleteClass);

router.patch(
  "/:classId/assign-student",
  protect,
  authorize("ADMIN"),
  assignStudentToClass,
);
router.patch(
  "/:classId/assign-teacher",
  protect,
  authorize("ADMIN"),
  assignTeacherToClass,
);
router.get(
  "/:id/members",
  protect,
  authorize("ADMIN", "TEACHER"),
  getClassWithMembers,
);

export default router;
