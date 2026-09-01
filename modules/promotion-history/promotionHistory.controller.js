import asyncHandler from "../../utils/asyncHandler.js";
import * as promotionHistoryService from "./promotionHistory.service.js";

export const createPromotionHistory = asyncHandler(async (req, res) => {
  const promotion = await promotionHistoryService.createPromotionHistory(
    req.body,
    req.user,
  );

  res.status(201).json({
    message: "Student promoted successfully",
    data: promotion,
  });
});

export const getPromotionHistory = asyncHandler(async (req, res) => {
  const promotions = await promotionHistoryService.getPromotionHistory(
    req.query,
    req.user,
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
    req.user.schoolId,
  );

  if (!promotion) {
    return res.status(404).json({ message: "Promotion not found" });
  }

  res.status(200).json({
    message: "Promotion fetched successfully",
    data: promotion,
  });
});

export const updatePromotion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await promotionHistoryService.updatePromotion(
    id,
    req.user.schoolId,
    req.body,
  );

  if (result.count === 0) {
    return res
      .status(404)
      .json({ message: "Promotion not found or not in your school" });
  }

  res.status(200).json({ message: "Promotion updated successfully" });
});

export const deletePromotion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const promotion = await promotionHistoryService.deletePromotion(id, req.user);

  res
    .status(200)
    .json({ message: "Promotion deleted successfully", data: promotion });
});
