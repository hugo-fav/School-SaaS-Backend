import express from "express";

import {
  createTeacher,
  getTeachers,
  getTeacher,
  updateTeacher,
  deleteTeacher,
} from "./teacher.controller.js";

import { protect } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/authorization.middleware.js";

const router = express.Router();

router.post("/", protect, authorize("ADMIN"), createTeacher);

router.get("/", protect, authorize("ADMIN", "TEACHER"), getTeachers);

router.get("/:id", protect, authorize("ADMIN", "TEACHER"), getTeacher);

router.put("/:id", protect, authorize("ADMIN"), updateTeacher);

router.delete("/:id", protect, authorize("ADMIN"), deleteTeacher);

export default router;
