import express from "express";
import { createBulkAttendance, deleteAttendance, getAttendance, getAttendanceById, updateAttendance } from "./attendance.controller.js";

import { protect } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/authorization.middleware.js";

const router = express.Router();

router.post("/", protect, authorize("ADMIN", "TEACHER"), createBulkAttendance);
router.get("/", protect, authorize("ADMIN", "TEACHER"), getAttendance);
router.get("/:id", protect, authorize("ADMIN", "TEACHER"), getAttendanceById);
router.put("/:id", protect, authorize("ADMIN"), updateAttendance);
router.delete("/:id", protect, authorize("ADMIN"), deleteAttendance);

export default router;
