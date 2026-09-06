import asyncHandler from "../../utils/asyncHandler.js";
import * as promotionHistoryService from "./promotionHistory.service.js";

export const createPromotionHistory = asyncHandler(async (req, res) => {
  const promotion = await promotionHistoryService.createPromotionHistory(
    req.body,
    req.user
  );

  res.status(201).json({
    message: "Student promoted successfully",
    data: promotion,
  });
});

export const getPromotionHistory = asyncHandler(async (req, res) => {
  const promotions = await promotionHistoryService.getPromotionHistory(
    req.query,
    req.user
  );

  res.status(200).json({
    message: "Promotion history fetched successfully",
    data: promotions,
  });
});

export const getPromotionHistoryById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const promotion = await promotionHistoryService.getPromotionHistoryById(
    id,
    req.user
  );

  res.status(200).json({
    message: "Promotion fetched successfully",
    data: promotion,
  });
});