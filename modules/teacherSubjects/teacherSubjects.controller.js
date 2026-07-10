import asyncHandler from "../../utils/asyncHandler.js";
import * as teacherSubjectService from "./teacherSubjects.service.js";

export const createTeacherSubject = asyncHandler(async (req, res) => {
  const teacherSubject = await teacherSubjectService.createTeacherSubject(
    req.body,
    req.user.schoolId,
  );

  res.status(201).json({
    message: "Teacher subject created successfully",
    data: teacherSubject,
  });
});

export const getTeacherSubjects = asyncHandler(async (req, res) => {
  const teacherSubjects = await teacherSubjectService.getTeacherSubjects(
    req.user.schoolId,
  );

  res.status(200).json({
    message: "Teacher subjects fetched successfully",
    data: teacherSubjects,
  });
});

export const getTeacherSubject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const teacherSubject = await teacherSubjectService.getTeacherSubject(
    id,
    req.user.schoolId,
  );

  if (!teacherSubject) {
    return res.status(404).json({ message: "Teacher subject not found" });
  }

  res.status(200).json({
    message: "Teacher subject fetched successfully",
    data: teacherSubject,
  });
});

export const updateTeacherSubject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await teacherSubjectService.updateTeacherSubject(
    id,
    req.user.schoolId,
    req.body,
  );

  if (result.count === 0) {
    return res
      .status(404)
      .json({ message: "Teacher subject not found or not in your school" });
  }

  res.status(200).json({ message: "Teacher subject updated successfully" });
});

export const deleteTeacherSubject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await teacherSubjectService.deleteTeacherSubject(
    id,
    req.user.schoolId,
  );

  if (result.count === 0) {
    return res
      .status(404)
      .json({ message: "Teacher subject not found or not in your school" });
  }

  res.status(200).json({ message: "Teacher subject deleted successfully" });
});
