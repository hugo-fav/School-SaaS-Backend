import asyncHandler from "../../utils/asyncHandler.js";
import * as authService from "./auth.service.js";

// REGISTER SCHOOL ADMIN
export const registerUser = asyncHandler(async (req, res) => {
  const user = await authService.registerUser(req.body);

  res.status(201).json({
    message: "User created successfully",
    data: user,
  });
});

// LOGIN
export const loginUser = asyncHandler(async (req, res) => {
  const { user, token } = await authService.loginUser(req.body);

  res.status(200).json({
    message: "Login successful",
    user,
    token,
  });
});
