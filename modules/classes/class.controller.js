import asyncHandler from "../../utils/asyncHandler.js";
import * as classService from "./class.service.js";

// Create Class
export const createClass = asyncHandler(async (req, res) => {
  const classData = await classService.createClass(req.body, req.user.schoolId);

  res.status(201).json({ message: "Class created", data: classData });
});

// get all classes
export const getClasses = asyncHandler(async (req, res) => {
  const classes = await classService.getClasses(req.user.schoolId);

  res.status(200).json({ message: "All classes", data: classes });
});

// get a class
export const getClass = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const classData = await classService.getClass(id, req.user.schoolId);

  if (!classData) {
    return res.status(404).json({ message: "Class not found" });
  }

  res.status(200).json({ message: "Class found", data: classData });
});

// updateClass
export const updateClass = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await classService.updateClass(
    id,
    req.user.schoolId,
    req.body,
  );

  if (result.count === 0) {
    return res.status(404).json({
      message: "Class not found or not in your school",
    });
  }

  res.status(200).json({
    message: "Class updated",
  });
});

// deleteClass
export const deleteClass = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await classService.deleteClass(id, req.user.schoolId);

  if (result.count === 0) {
    return res.status(404).json({
      message: "Class not found or not in your school",
    });
  }

  res.status(200).json({
    message: "Class deleted",
  });
});

// Assign teacher to class
export const assignTeacherToClass = asyncHandler(async (req, res) => {
  const { classId, teacherId } = req.body;

  const { teacher, result } = await classService.assignTeacherToClass(
    classId,
    teacherId,
    req.user.schoolId,
  );

  if (!teacher) {
    return res.status(404).json({
      message: "Teacher not found or not in your school",
    });
  }

  if (result.count === 0) {
    return res.status(404).json({
      message: "Class not found or not in your school",
    });
  }

  res.status(200).json({
    message: "Teacher assigned to class",
  });
});

// Get classes taught by a teacher
export const getTeacherClasses = asyncHandler(async (req, res) => {
  const { teacherId } = req.params;

  const teacher = await classService.getTeacherClasses(
    teacherId,
    req.user.schoolId,
  );

  if (!teacher) {
    return res.status(404).json({
      message: "Teacher not found",
    });
  }

  res.status(200).json({
    data: teacher.taughtClasses,
  });
});

// Enroll student to class
export const assignStudentToClass = asyncHandler(async (req, res) => {
  const { classId } = req.params;
  const { studentId } = req.body;

  if (!classId) {
    return res.status(400).json({
      success: false,
      message: "classId is required",
    });
  }

  if (!studentId) {
    return res.status(400).json({
      success: false,
      message: "studentId is required",
    });
  }

  const assignment = await classService.assignStudentToClass(
    classId,
    studentId,
    req.user.schoolId,
  );

  if (assignment.notFoundStudent) {
    return res.status(404).json({
      success: false,
      message: "Student not found or not in your school",
    });
  }

  if (assignment.notFoundClass) {
    return res.status(404).json({
      success: false,
      message: "Class not found or not in your school",
    });
  }

  if (assignment.alreadyEnrolled) {
    return res.status(400).json({
      success: false,
      message: "Student is already enrolled in this class",
    });
  }

  res.status(200).json({
    success: true,
    message: "Student enrolled successfully",
    data: assignment.updatedClass,
  });
});

// get students in a class
export const getClassWithMembers = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const classData = await classService.getClassWithMembers(id);

  if (!classData) {
    return res.status(404).json({
      message: "Class not found",
    });
  }

  res.status(200).json({
    message: "Class details fetched",
    data: classData,
  });
});
