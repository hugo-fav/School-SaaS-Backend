import asyncHandler from "../../utils/asyncHandler.js";
import * as enrollmentService from "./enrollments.service.js";

export const createEnrollment = asyncHandler(async (req, res) => {
  const enrollment = await enrollmentService.createEnrollment(
    req.body,
    req.user,
  );

  res.status(201).json({
    message: "Student enrolled successfully.",
    data: enrollment,
  });
});

export const getEnrollments = asyncHandler(async (req, res) => {
  const enrollment = await enrollmentService.getEnrollments(req.user.schoolId);

  res.status(200).json({
    message: "Enrollment fetched successfully",
    data: enrollment,
  });
});

export const getEnrollment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const enrollment = await enrollmentService.getEnrollment(
    id,
    req.user.schoolId,
  );

  res.status(200).json({
    status: true,
    message: "Enrollment fetched successfully",
    data: enrollment,
  });
});

export const updateEnrollment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await enrollmentService.updateEnrollment(
    id,
    req.body,
    req.user,
  );

  res
    .status(200)
    .json({ message: "Enrollment updated successfully", data: result });
});

export const deleteEnrollment = asyncHandler(async (req, res) => {
  await enrollmentService.deleteEnrollment(req.params.id, req.user);

  res.status(200).json({ message: "Enrollment deleted successfully" });
});
