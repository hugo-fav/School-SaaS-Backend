import express from "express";

import {
  createStudent,
  deleteStudent,
  getStudent,
  getStudents,
  updateStudent,
} from "./student.controller.js";

import { protect } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/authorization.middleware.js";

const router = express.Router();

router.post("/", protect, authorize("ADMIN"), createStudent);

router.get("/", protect, authorize("ADMIN", "TEACHER"), getStudents);

router.get("/:id", protect, authorize("ADMIN", "TEACHER"), getStudent);

router.put("/:id", protect, authorize("ADMIN"), updateStudent);

router.delete("/:id", protect, authorize("ADMIN"), deleteStudent);

export default router;
