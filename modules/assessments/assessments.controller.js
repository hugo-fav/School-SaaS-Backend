import asyncHandler from "../../utils/asyncHandler.js";
import * as assessmentService from "./assessments.service.js";

export const createAssessment = asyncHandler(async (req, res) => {
  const assessment = await assessmentService.createAssessment(
    req.body,
    req.user,
  );

  res.status(201).json({
    success: true,
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

  res.status(200).json({
    status: true,
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
  await assessmentService.deleteAssessment(req.params.id, req.user);

  res.status(200).json({ message: "Assessment deleted successfully" });
});

export const publishAssessment = asyncHandler(async (req, res) => {
  const assessment = await assessmentService.publishedAssessmet(
    req.params.id,
    req.user,
  );

  res.status(200).json({
    message: "Assessment published successfully.",
    data: assessment,
  });
});

export const unpublishAssessment = asyncHandler(async (req, res) => {
  const assessment = await assessmentService.unpublishAssessment(
    req.params.id,
    req.user,
  );

  res.status(200).json({
    message: "Assessment unpublished successfully",
    data: assessment,
  });
});
