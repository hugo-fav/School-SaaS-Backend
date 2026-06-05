import prisma from "../../config/prisma.js";
import asyncHandler from "../../utils/asyncHandler.js";

// CREATE SCHOOL
export const createSchool = asyncHandler(async (req, res) => {
  const { name } = req.body;

  const school = await prisma.school.create({
    data: {
      name,
      createdAt: new Date(),
      updatedAt: new Date(),
      schoolId: req.user.schoolId,
    },
  });

  res.status(201).json({
    message: "School created successfully",
    data: school,
  });
});

// GET ALL SCHOOLS
export const getSchools = asyncHandler(async (req, res) => {
  const schools = await prisma.school.findMany();

  res.status(200).json({
    message: "All schools fetched",
    data: schools,
  });
});

// GET SINGLE SCHOOL
export const getSchool = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const school = await prisma.school.findUnique({
    where: { schoolId: req.user.schoolId, id },
  });

  if (!school) {
    return res.status(404).json({
      message: "School not found",
    });
  }

  res.status(200).json({
    message: "School found",
    data: school,
  });
});

// UPDATE SCHOOL
export const updateSchool = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  const school = await prisma.school.findUnique({
    where: { schoolId: req.user.schoolId, id },
  });

  if (!school) {
    return res.status(404).json({
      message: "School not found",
    });
  }

  const updatedSchool = await prisma.school.update({
    where: { schoolId: req.user.schoolId, id },
    data: { name, updatedAt: new Date() },
  });

  res.status(200).json({
    message: "School updated successfully",
    data: updatedSchool,
  });
});

// DELETE SCHOOL
export const deleteSchool = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await prisma.school.delete({
    where: { schoolId: req.user.schoolId, id },
  });

  res.status(200).json({
    message: "School deleted successfully",
  });
});
