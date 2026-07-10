import asyncHandler from "../../utils/asyncHandler.js";
import * as studentService from "./student.service.js";

// CREATE STUDENT
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

// GET ALL STUDENTS
export const getStudents = asyncHandler(async (req, res) => {
  const students = await studentService.getStudents(req.user.schoolId);

  res.status(200).json({
    message: "Students fetched successfully",
    data: students,
  });
});

// GET SINGLE STUDENT
export const getStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const student = await studentService.getStudent(id, req.user.schoolId);

  if (!student) {
    return res.status(404).json({
      message: "Student not found",
    });
  }

  res.status(200).json({
    message: "Student fetched successfully",
    data: student,
  });
});

// UPDATE STUDENT
export const updateStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await studentService.updateStudent(
    id,
    req.user.schoolId,
    req.body,
  );

  if (result.count === 0) {
    return res.status(404).json({
      message: "Student not found or not in your school",
    });
  }

  res.status(200).json({
    message: "Student updated successfully",
  });
});

// DELETE STUDENT
export const deleteStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await studentService.deleteStudent(id, req.user.schoolId);

  if (result.count === 0) {
    return res.status(404).json({
      message: "Student not found or not in your school",
    });
  }

  res.status(200).json({
    message: "Student deleted successfully",
  });
});
