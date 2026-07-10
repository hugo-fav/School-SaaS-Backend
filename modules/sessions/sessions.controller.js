import asyncHandler from "../../utils/asyncHandler.js";
import * as sessionService from "./sessions.service.js";

export const createSession = asyncHandler(async (req, res) => {
  const session = await sessionService.createSession(
    req.body,
    req.user.schoolId,
  );

  res.status(201).json({
    message: "Session created successfully",
    data: session,
  });
});

export const getSessions = asyncHandler(async (req, res) => {
  const sessions = await sessionService.getSessions(req.user.schoolId);

  res.status(200).json({
    message: "Sessions fetched successfully",
    data: sessions,
  });
});

export const getSession = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const session = await sessionService.getSession(id, req.user.schoolId);

  if (!session) {
    return res.status(404).json({ message: "Session not found" });
  }

  res.status(200).json({
    message: "Session fetched successfully",
    data: session,
  });
});

export const updateSession = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await sessionService.updateSession(
    id,
    req.user.schoolId,
    req.body,
  );

  if (result.count === 0) {
    return res
      .status(404)
      .json({ message: "Session not found or not in your school" });
  }

  res.status(200).json({ message: "Session updated successfully" });
});

export const deleteSession = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await sessionService.deleteSession(id, req.user.schoolId);

  if (result.count === 0) {
    return res
      .status(404)
      .json({ message: "Session not found or not in your school" });
  }

  res.status(200).json({ message: "Session deleted successfully" });
});
