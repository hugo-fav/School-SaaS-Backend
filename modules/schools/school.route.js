import express from "express";
import {
  createSchool,
  deleteSchool,
  getSchool,
  getSchools,
  updateSchool,
} from "./school.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", protect, createSchool);
router.get("/", protect, getSchools);
router.get("/:id", protect, getSchool);
router.put("/:id", protect, updateSchool);
router.delete("/:id", protect, deleteSchool);

export default router;
