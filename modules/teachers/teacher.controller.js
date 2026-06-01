import prisma from "../../config/prisma.js";
import asyncHandler from "../../utils/asyncHandler.js";
import bcrypt from "bcrypt";

// CRUD operations for teachers
// createTeacher
export const createTeacher = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  const teacher = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: "TEACHER",
      schoolId: req.user.schoolId,
    },
  });

  res.status(201).json({
    message: "Teacher created successfully",
    data: teacher,
  });
});

// get all Teachers
export const getTeachers = asyncHandler(async (req, res) => {
  const teachers = await prisma.user.findMany({
    where: {
      role: "TEACHER",
      schoolId: req.user.schoolId, // 🔥 ISOLATION
    },
  });

  res.status(200).json({
    message: "Teachers fetched successfully",
    data: teachers,
  });
});

// getTeacher
export const getTeacher = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const teacher = await prisma.user.findFirst({
    where: {
      id,
      role: "TEACHER",
      schoolId: req.user.schoolId, // 🔥 SECURITY
    },
  });

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
  const { name, email } = req.body;

  const result = await prisma.user.updateMany({
    where: {
      id,
      role: "TEACHER",
      schoolId: req.user.schoolId, 
    },
    data: {
      name,
      email,
    },
  });

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

  const result = await prisma.user.deleteMany({
    where: {
      id,
      role: "TEACHER",
      schoolId: req.user.schoolId, // 🔥 CRITICAL
    },
  });

  if (result.count === 0) {
    return res.status(404).json({
      message: "Teacher not found or not in your school",
    });
  }

  res.status(200).json({
    message: "Teacher deleted successfully",
  });
});
