import asyncHandler from "../../utils/asyncHandler.js";
import * as studentService from "./student.service.js";

export const createStudent = asyncHandler(async (req, res) => {
  const student = await studentService.createStudent(
    req.body,
    req.user.schoolId,
  );

  res.status(201).json({
    message: "Student created successfully",
    data: student,
  });
});

export const getStudents = asyncHandler(async (req, res) => {
  const students =
    req.user.role === "TEACHER"
      ? await studentService.getStudentsForTeacher(
          req.user.id,
          req.user.schoolId,
        )
      : await studentService.getStudents(req.user.schoolId);

  res.status(200).json({
    message: "Students fetched successfully",
    data: students,
  });
});

export const getStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const student =
    req.user.role === "TEACHER"
      ? await studentService.getStudentForTeacher(
          id,
          req.user.id,
          req.user.schoolId,
        )
      : await studentService.getStudent(id, req.user.schoolId);

  if (!student) {
    return res.status(404).json({ message: "Student not found" });
  }

  res.status(200).json({
    message: "Student fetched successfully",
    data: student,
  });
});

export const updateStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const updatedStudent = await studentService.updateStudent(
    id,
    req.user.schoolId,
    req.body,
  );

  res.status(200).json({
    message: "Student updated successfully",
    data: updatedStudent,
  });
});

export const deactivateStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const student = await studentService.deactivateStudent(id, req.user.schoolId);

  res.status(200).json({
    message: "Student deactivated successfully",
    data: student,
  });
});

// getMyProfile, getMyClasses, getMyResults, getMyAttendance — unchanged
export const getMyProfile = asyncHandler(async (req, res) => {
  const student = await studentService.getMyProfile(req.user);
  res
    .status(200)
    .json({ message: "Student profile retrieved successfully", data: student });
});

export const getMyClasses = asyncHandler(async (req, res) => {
  const classes = await studentService.getMyClasses(req.user);
  res.status(200).json({
    message: "Student classes retrieved successfully",
    results: classes.length,
    data: classes,
  });
});

export const getMyResults = asyncHandler(async (req, res) => {
  const { sessionId, termId } = req.query;
  const results = await studentService.getMyResults(
    sessionId,
    termId,
    req.user,
  );
  res
    .status(200)
    .json({ message: "Student results retrieved successfully", data: results });
});

export const getMyAttendance = asyncHandler(async (req, res) => {
  const { sessionId, termId } = req.query;
  const attendance = await studentService.getMyAttendance(
    sessionId,
    termId,
    req.user,
  );
  res.status(200).json({
    message: "Student attendance retrieved successfully",
    data: attendance,
  });
});
