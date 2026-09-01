import asyncHandler from "../../utils/asyncHandler.js";
import * as teacherSubjectService from "./teacherSubjects.service.js";

//  Assign Teacher to Subject
export const createTeacherSubject = asyncHandler(async (req, res) => {
  const assignment = await teacherSubjectService.createTeacherSubject(
    req.body,
    req.user.schoolId,
  );

  console.log(assignment);

  res.status(201).json({
    message: "Teacher assigned successfully",
    data: assignment,
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

  res
    .status(200)
    .json({ message: "Teacher subject updated successfully", data: result });
});

export const deleteTeacherSubject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await teacherSubjectService.deleteTeacherSubject(
    id,
    req.user.schoolId,
  );

  res.status(200).json({ message: "Teacher subject deleted successfully" });
});
