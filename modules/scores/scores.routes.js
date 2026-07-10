import express from "express";
import {
  createScore,
  getScores,
  getScore,
  updateScore,
  deleteScore,
} from "./scores.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/authorization.middleware.js";

const router = express.Router();

router.post("/", protect, authorize("ADMIN"), createScore);
router.get("/", protect, authorize("ADMIN", "TEACHER"), getScores);
router.get("/:id", protect, authorize("ADMIN", "TEACHER"), getScore);
router.put("/:id", protect, authorize("ADMIN"), updateScore);
router.delete("/:id", protect, authorize("ADMIN"), deleteScore);

export default router;
