import asyncHandler from "../../utils/asyncHandler.js";
import * as subjectService from "./subjects.service.js";

export const createSubject = asyncHandler(async (req, res) => {
  const subject = await subjectService.createSubject(
    req.body,
    req.user.schoolId,
  );

  res.status(201).json({
    message: "Subject created successfully",
    data: subject,
  });
});

export const getSubjects = asyncHandler(async (req, res) => {
  const subjects = await subjectService.getSubjects(req.user.schoolId);

  res.status(200).json({
    message: "Subjects fetched successfully",
    data: subjects,
  });
});

export const getSubject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const subject = await subjectService.getSubject(id, req.user.schoolId);

  if (!subject) {
    return res.status(404).json({ message: "Subject not found" });
  }

  res.status(200).json({
    message: "Subject fetched successfully",
    data: subject,
  });
});

export const updateSubject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await subjectService.updateSubject(
    id,
    req.user.schoolId,
    req.body,
  );

  if (result.count === 0) {
    return res
      .status(404)
      .json({ message: "Subject not found or not in your school" });
  }

  res.status(200).json({ message: "Subject updated successfully" });
});

export const deleteSubject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await subjectService.deleteSubject(id, req.user.schoolId);

  if (result.count === 0) {
    return res
      .status(404)
      .json({ message: "Subject not found or not in your school" });
  }

  res.status(200).json({ message: "Subject deleted successfully" });
});
