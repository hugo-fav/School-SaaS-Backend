import asyncHandler from "../../utils/asyncHandler.js";
import * as schoolService from "./school.service.js";

// CREATE SCHOOL
export const createSchool = asyncHandler(async (req, res) => {
  const school = await schoolService.createSchool(req.body);

  res.status(201).json({
    message: "School created successfully",
    data: school,
  });
});

// GET ALL SCHOOLS
export const getSchools = asyncHandler(async (req, res) => {
  const schools = await schoolService.getSchools();

  res.status(200).json({
    message: "All schools fetched",
    data: schools,
  });
});

// GET SINGLE SCHOOL
export const getSchool = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const school = await schoolService.getSchool(req.user.schoolId, id);

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

  const updatedSchool = await schoolService.updateSchool(
    req.user.schoolId,
    id,
    req.body,
  );

  if (!updatedSchool) {
    return res.status(404).json({
      message: "School not found",
    });
  }

  res.status(200).json({
    message: "School updated successfully",
    data: updatedSchool,
  });
});

// DELETE SCHOOL
export const deleteSchool = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const deletedSchool = await schoolService.deleteSchool(req.user.schoolId, id);

  if (!deletedSchool) {
    return res.status(404).json({
      message: "School not found",
    });
  }

  res.status(200).json({
    message: "School deleted successfully",
  });
});
