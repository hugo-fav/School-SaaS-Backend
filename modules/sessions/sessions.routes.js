import express from "express";
import {
  createSession,
  getSessions,
  getSession,
  updateSession,
  deleteSession,
} from "./sessions.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/authorization.middleware.js";

const router = express.Router();

router.post("/", protect, authorize("ADMIN"), createSession);
router.get("/", protect, authorize("ADMIN", "TEACHER"), getSessions);
router.get("/:id", protect, authorize("ADMIN", "TEACHER"), getSession);
router.put("/:id", protect, authorize("ADMIN"), updateSession);
router.delete("/:id", protect, authorize("ADMIN"), deleteSession);

export default router;
