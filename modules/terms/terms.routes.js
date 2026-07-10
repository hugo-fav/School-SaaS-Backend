import express from "express";
import {
  createTerm,
  getTerms,
  getTerm,
  updateTerm,
  deleteTerm,
} from "./terms.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/authorization.middleware.js";

const router = express.Router();

router.post("/", protect, authorize("ADMIN"), createTerm);
router.get("/", protect, authorize("ADMIN", "TEACHER"), getTerms);
router.get("/:id", protect, authorize("ADMIN", "TEACHER"), getTerm);
router.put("/:id", protect, authorize("ADMIN"), updateTerm);
router.delete("/:id", protect, authorize("ADMIN"), deleteTerm);

export default router;
