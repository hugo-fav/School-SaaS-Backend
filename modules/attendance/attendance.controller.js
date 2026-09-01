import asyncHandler from "../../utils/asyncHandler.js";
import * as attendanceService from "./attendance.service.js";

export const createBulkAttendance = asyncHandler(async (req, res) => {
  const attendance = await attendanceService.createBulkAttendance(
    req.body,
    req.user,
  );

  res.status(201).json({
    message: "Attendance recorded successfully",
    data: attendance,
  });
});

export const getAttendance = asyncHandler(async (req, res) => {
  const attendance = await attendanceService.getAttendance(req.query, req.user);

  res.status(200).json({
    message: "Attendance fetched successfully",
    results: attendance.length,
    data: attendance,
  });
});

export const getAttendanceById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const attendance = await attendanceService.getAttendanceById(
    id,
    req.user.schoolId,
  );

  if (!attendance) {
    return res.status(404).json({ message: "Attendance not found" });
  }

  res.status(200).json({
    message: "Attendance fetched successfully",
    data: attendance,
  });
});

export const updateAttendance = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const attendance = await attendanceService.updateAttendance(
    id,
    req.user,
    req.body,
  );

  if (!attendance) {
    return res
      .status(404)
      .json({ message: "Attendance not found or not in your school" });
  }

  res.status(200).json({ message: "Attendance updated successfully" });
});

export const deleteAttendance = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const attendance = await attendanceService.deleteAttendance(id, req.user);

  res
    .status(200)
    .json({ message: "Attendance deleted successfully", data: attendance });
});
