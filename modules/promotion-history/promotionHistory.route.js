import express from "express";
import {
  createPromotionHistory,
  getPromotionHistory,
  getPromotionHistoryById,

  //   updatePromotion,
  //   deletePromotion
} from "./promotionHistory.controller.js";
import { protect } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/authorization.middleware.js";

const router = express.Router();

router.post("/", protect, authorize("ADMIN"), createPromotionHistory);
router.get("/", protect, authorize("ADMIN", "TEACHER"), getPromotionHistory);
router.get(
  "/:id",
  protect,
  authorize("ADMIN", "TEACHER"),
  getPromotionHistoryById,
);
// router.put("/:id", protect, authorize("ADMIN"), updatePromotion);
// router.delete("/:id", protect, authorize("ADMIN"), deletePromotion);

export default router;
