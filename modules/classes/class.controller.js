import prisma from "../../config/prisma.js";
import asyncHandler from "../../utils/asyncHandler.js";

// console.log("prisma:", prisma)

// CRUD

// Create Class
export const createClass = asyncHandler(async (req, res) => {
  const { name } = req.body;

  const classData = await prisma.class.create({
    data: { name, schoolId: req.user.schoolId },
  });

  res.status(201).json({ message: "Class created", data: classData });
});

// get all classes
export const getClasses = asyncHandler(async (req, res) => {
  const classes = await prisma.class.findMany({
    where: { schoolId: req.user.schoolId },
  });

  res.status(200).json({ message: "All classes", data: classes });
});

// get a class
export const getClass = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const classData = await prisma.class.findFirst({
    where: { id, schoolId: req.user.schoolId },
  });

  if (!classData) {
    return res.status(404).json({ message: "Class not found" });
  }

  res.status(200).json({ message: "Class found", data: classData });
});

// updateClass
export const updateClass = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  const result = await prisma.class.updateMany({
    where: {
      id,
      schoolId: req.user.schoolId,
    },
    data: {
      name,
    },
  });

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

  const result = await prisma.class.deleteMany({
    where: {
      id,
      schoolId: req.user.schoolId, // 🔥 CRITICAL SAFETY
    },
  });

  if (result.count === 0) {
    return res.status(404).json({
      message: "Class not found or not in your school",
    });
  }

  res.status(200).json({
    message: "Class deleted",
  });
});

// this other functions are for assigning teachers and students to classes, and fetching class details with members

// Assign teacher to class
export const assignTeacherToClass = asyncHandler(async (req, res) => {
  const { classId, teacherId } = req.body;

  const teacher = await prisma.user.findFirst({
    where: {
      id: teacherId,
      schoolId: req.user.schoolId,
      role: "TEACHER",
    },
  });

  if (!teacher) {
    return res.status(404).json({
      message: "Teacher not found or not in your school",
    });
  }

  const updateClass = await prisma.class.updateMany({
    where: {
      id: classId,
      schoolId: req.user.schoolId,
    },
    data: {
      teacherId,
    },
  });

  if (updateClass.count === 0) {
    return res.status(404).json({
      message: "Class not found or not in your school",
    });
  }

  res.status(200).json({
    message: "Teacher assigned to class",
  });
});

// Enroll student to class
export const assignStudentToClass = asyncHandler(async (req, res) => {
  const { classId, studentId } = req.body;

  // Check if student exists and belongs to the same school
  const student = await prisma.student.findFirst({
    where: {
      id: studentId,
      schoolId: req.user.schoolId,
      role: "STUDENT",
    },
  });

  if (!student) {
    return res.status(404).json({
      message: "Student not found or not in your school",
    });
  }

  // check if class exists and belongs to the same school
  const classData = await prisma.class.findFirst({
    where: {
      id: classId,
      schoolId: req.user.schoolId,
    },
  });

  if (!classData) {
    return res.status(404).json({
      message: "Class not found or not in your school",
    });
  }

  // Enroll student to class
  const updatedClass = await prisma.class.update({
    where: { id: classId },
    data: {
      students: {
        connect: { id: studentId },
      },
    },
    include: {
      students: true,
    },
  });

  res.status(200).json({
    message: "Student enrolled in class",
    data: updatedClass,
  });
});

// get students in a class
export const getClassWithMembers = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const classData = await prisma.class.findFirst({
    where: {
      id,
      schoolId: req.user.schoolId,
    },
    include: {
      teacher: true,
      students: true,
    },
  });

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
