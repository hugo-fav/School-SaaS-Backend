import prisma from "../../config/prisma.js";
import asyncHandler from "../../utils/asyncHandler.js";
import bcrypt from "bcrypt";

// CREATE STUDENT
export const createStudent = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  const student = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: "STUDENT",
      schoolId: req.user.schoolId, // FORCE SCHOOL OWNERSHIP
    },
  });

  res.status(201).json({
    message: "Student created successfully",
    data: student,
  });
});

// GET ALL STUDENTS
export const getStudents = asyncHandler(async (req, res) => {
  const students = await prisma.user.findMany({
    where: {
      role: "STUDENT",
      schoolId: req.user.schoolId, // 🔥 CRITICAL SECURITY RULE
    },
  });

  res.status(200).json({
    message: "Students fetched successfully",
    data: students,
  });
});

// GET SINGLE STUDENT
export const getStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const student = await prisma.user.findFirst({
    where: {
      id,
      role: "STUDENT",
      schoolId: req.user.schoolId, // 🔥 PREVENT CROSS-SCHOOL ACCESS
    },
  });

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
  const { name, email } = req.body;

  const student = await prisma.user.updateMany({
    where: {
      id,
      role: "STUDENT",
      schoolId: req.user.schoolId, // 🔥 SECURITY CHECK
    },
    data: {
      name,
      email,
    },
  });

  if (student.count === 0) {
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

  const result = await prisma.user.deleteMany({
    where: {
      id,
      role: "STUDENT",
      schoolId: req.user.schoolId, // 🔥 ABSOLUTE SAFETY
    },
  });

  if (result.count === 0) {
    return res.status(404).json({
      message: "Student not found or not in your school",
    });
  }

  res.status(200).json({
    message: "Student deleted successfully",
  });
});
