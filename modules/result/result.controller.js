import asyncHandler from "../../utils/asyncHandler.js";
import * as resultService from "./result.service.js";

export const getStudentResults = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const { sessionId, termId } = req.query;

  const results = await resultService.getStudentResults(
    studentId,
    sessionId,
    termId,
    req.user,
  );

  res.status(200).json({
    message: "Student results retrieved successfully",
    data: results,
  });
});
