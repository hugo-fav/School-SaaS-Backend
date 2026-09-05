import asyncHandler from "../../utils/asyncHandler.js";
import * as classService from "./class.service.js";

export const createClass = asyncHandler(async (req, res) => {
  const classData = await classService.createClass(req.body, req.user.schoolId);
  res.status(201).json({ message: "Class created", data: classData });
});

export const getClasses = asyncHandler(async (req, res) => {
  const classes = await classService.getClasses(req.user.schoolId);
  res.status(200).json({ message: "All classes", data: classes });
});

export const getClass = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const classData = await classService.getClass(id, req.user.schoolId);

  if (!classData) {
    return res.status(404).json({ message: "Class not found" });
  }

  res.status(200).json({ message: "Class found", data: classData });
});

export const updateClass = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await classService.updateClass(
    id,
    req.user.schoolId,
    req.body,
  );

  if (result.count === 0) {
    return res
      .status(404)
      .json({ message: "Class not found or not in your school" });
  }

  res.status(200).json({ message: "Class updated" });
});

export const deleteClass = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await classService.deleteClass(id, req.user.schoolId);
  res.status(200).json({ message: "Class deleted" });
});

export const enrollStudentInClass = asyncHandler(async (req, res) => {
  const { classId } = req.params;
  const { studentId, sessionId } = req.body;

  const enrollment = await classService.enrollStudentInClass(
    classId,
    studentId,
    sessionId,
    req.user,
  );

  res.status(201).json({
    success: true,
    message: "Student enrolled successfully",
    data: enrollment,
  });
});

export const getClassWithMembers = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { sessionId } = req.query;

  const classData = await classService.getClassWithMembers(
    id,
    req.user.schoolId,
    sessionId,
  );

  if (!classData) {
    return res.status(404).json({ message: "Class not found" });
  }

  res.status(200).json({ message: "Class details fetched", data: classData });
});
