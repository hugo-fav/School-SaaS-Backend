import express from "express";
import {
  createSubject,
  getSubjects,
  getSubject,
  updateSubject,
  deleteSubject,
} from "./subjects.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/authorization.middleware.js";

const router = express.Router();

router.post("/", protect, authorize("ADMIN"), createSubject);
router.get("/", protect, authorize("ADMIN", "TEACHER"), getSubjects);
router.get("/:id", protect, authorize("ADMIN", "TEACHER"), getSubject);
router.put("/:id", protect, authorize("ADMIN"), updateSubject);
router.delete("/:id", protect, authorize("ADMIN"), deleteSubject);

export default router;
