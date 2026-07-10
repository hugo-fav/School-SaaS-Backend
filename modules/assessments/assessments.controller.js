import asyncHandler from "../../utils/asyncHandler.js";
import * as assessmentService from "./assessments.service.js";

export const createAssessment = asyncHandler(async (req, res) => {
  const assessment = await assessmentService.createAssessment(
    req.body,
    req.user.schoolId,
  );

  res.status(201).json({
    message: "Assessment created successfully",
    data: assessment,
  });
});

export const getAssessments = asyncHandler(async (req, res) => {
  const assessments = await assessmentService.getAssessments(req.user.schoolId);

  res.status(200).json({
    message: "Assessments fetched successfully",
    data: assessments,
  });
});

export const getAssessment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const assessment = await assessmentService.getAssessment(
    id,
    req.user.schoolId,
  );

  if (!assessment) {
    return res.status(404).json({ message: "Assessment not found" });
  }

  res.status(200).json({
    message: "Assessment fetched successfully",
    data: assessment,
  });
});

export const updateAssessment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await assessmentService.updateAssessment(
    id,
    req.user.schoolId,
    req.body,
  );

  if (result.count === 0) {
    return res
      .status(404)
      .json({ message: "Assessment not found or not in your school" });
  }

  res.status(200).json({ message: "Assessment updated successfully" });
});

export const deleteAssessment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await assessmentService.deleteAssessment(
    id,
    req.user.schoolId,
  );

  if (result.count === 0) {
    return res
      .status(404)
      .json({ message: "Assessment not found or not in your school" });
  }

  res.status(200).json({ message: "Assessment deleted successfully" });
});
