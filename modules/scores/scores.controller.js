import asyncHandler from "../../utils/asyncHandler.js";
import * as scoreService from "./scores.service.js";

export const createScore = asyncHandler(async (req, res) => {
  const score = await scoreService.createScore(req.body, req.user.schoolId);

  res.status(201).json({
    message: "Score created successfully",
    data: score,
  });
});

export const getScores = asyncHandler(async (req, res) => {
  const scores = await scoreService.getScores(req.user.schoolId);

  res.status(200).json({
    message: "Scores fetched successfully",
    data: scores,
  });
});

export const getScore = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const score = await scoreService.getScore(id, req.user.schoolId);

  if (!score) {
    return res.status(404).json({ message: "Score not found" });
  }

  res.status(200).json({
    message: "Score fetched successfully",
    data: score,
  });
});

export const updateScore = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await scoreService.updateScore(
    id,
    req.user.schoolId,
    req.body,
  );

  if (result.count === 0) {
    return res
      .status(404)
      .json({ message: "Score not found or not in your school" });
  }

  res.status(200).json({ message: "Score updated successfully" });
});

export const deleteScore = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await scoreService.deleteScore(id, req.user.schoolId);

  if (result.count === 0) {
    return res
      .status(404)
      .json({ message: "Score not found or not in your school" });
  }

  res.status(200).json({ message: "Score deleted successfully" });
});
