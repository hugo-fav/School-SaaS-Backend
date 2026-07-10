import asyncHandler from "../../utils/asyncHandler.js";
import * as teacherService from "./teacher.service.js";

// createTeacher
export const createTeacher = asyncHandler(async (req, res) => {
  const teacher = await teacherService.createTeacher(
    req.body,
    req.user.schoolId,
  );

  res.status(201).json({
    message: "Teacher created successfully",
    data: teacher,
  });
});

// get all Teachers
export const getTeachers = asyncHandler(async (req, res) => {
  const teachers = await teacherService.getTeachers(req.user.schoolId);

  res.status(200).json({
    message: "Teachers fetched successfully",
    data: teachers,
  });
});

// getTeacher
export const getTeacher = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const teacher = await teacherService.getTeacher(id, req.user.schoolId);

  if (!teacher) {
    return res.status(404).json({
      message: "Teacher not found",
    });
  }

  res.status(200).json({
    message: "Teacher fetched successfully",
    data: teacher,
  });
});

// updateTeacher
export const updateTeacher = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const result = await teacherService.updateTeacher(
    id,
    req.user.schoolId,
    updateData,
  );

  if (result.count === 0) {
    return res.status(404).json({
      message: "Teacher not found or not in your school",
    });
  }

  res.status(200).json({
    message: "Teacher updated successfully",
  });
});

// deleteTeacher
export const deleteTeacher = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await teacherService.deleteTeacher(id, req.user.schoolId);

  if (result.count === 0) {
    return res.status(404).json({
      message: "Teacher not found or not in your school",
    });
  }

  res.status(200).json({
    message: "Teacher deleted successfully",
  });
});

export const getMyProfile = asyncHandler(async (req, res) => {
  const teacher = await teacherService.getMyProfile(
    req.user.id,
    req.user.schoolId,
  );

  if (!teacher) {
    return res.status(404).json({
      message: "Teacher not found",
    });
  }

  res.status(200).json({
    message: "Teacher profile fetched successfully",
    data: teacher,
  });
});

export const getMyClasses = asyncHandler(async (req, res) => {
  const classes = await teacherService.getMyClasses(
    req.user.id,
    req.user.schoolId,
  );

  res.status(200).json({
    message: "Teacher's classes fetched successfully",
    data: classes,
  });
});

export const getMyStudents = asyncHandler(async (req, res) => {
  const classes = await teacherService.getMyStudents(
    req.user.id,
    req.user.schoolId,
  );

  res.status(200).json({
    message: "Teacher's students fetched successfully",
    data: classes,
  });
});
