import asyncHandler from "../../utils/asyncHandler.js";
import * as schoolService from "./school.service.js";

export const getMySchool = asyncHandler(async (req, res) => {
  const school = await schoolService.getMySchool(req.user.schoolId);

  if (!school) {
    return res.status(404).json({ message: "School not found" });
  }

  res.status(200).json({
    message: "School fetched successfully",
    data: school,
  });
});

export const updateMySchool = asyncHandler(async (req, res) => {
  const updatedSchool = await schoolService.updateMySchool(
    req.user.schoolId,
    req.body,
  );

  res.status(200).json({
    message: "School updated successfully",
    data: updatedSchool,
  });
});

export const deactivateMySchool = asyncHandler(async (req, res) => {
  await schoolService.deactivateMySchool(req.user.schoolId);

  res.status(200).json({
    message: "School deactivated successfully",
  });
});

export const updatePaymentSettings = asyncHandler(async (req, res) => {
  const school = await schoolService.updatePaymentSettings(
    req.user.schoolId,
    req.body,
  );

  res.status(200).json({
    success: true,
    message: "Payment settings updated successfully",
    data: school,
  });
});
