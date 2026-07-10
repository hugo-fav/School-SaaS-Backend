import asyncHandler from "../../utils/asyncHandler.js";
import * as termService from "./terms.service.js";

export const createTerm = asyncHandler(async (req, res) => {
  const term = await termService.createTerm(req.body, req.user.schoolId);

  res.status(201).json({
    message: "Term created successfully",
    data: term,
  });
});

export const getTerms = asyncHandler(async (req, res) => {
  const terms = await termService.getTerms(req.user.schoolId);

  res.status(200).json({
    message: "Terms fetched successfully",
    data: terms,
  });
});

export const getTerm = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const term = await termService.getTerm(id, req.user.schoolId);

  if (!term) {
    return res.status(404).json({ message: "Term not found" });
  }

  res.status(200).json({
    message: "Term fetched successfully",
    data: term,
  });
});

export const updateTerm = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await termService.updateTerm(id, req.user.schoolId, req.body);

  if (result.count === 0) {
    return res
      .status(404)
      .json({ message: "Term not found or not in your school" });
  }

  res.status(200).json({ message: "Term updated successfully" });
});

export const deleteTerm = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await termService.deleteTerm(id, req.user.schoolId);

  if (result.count === 0) {
    return res
      .status(404)
      .json({ message: "Term not found or not in your school" });
  }

  res.status(200).json({ message: "Term deleted successfully" });
});
