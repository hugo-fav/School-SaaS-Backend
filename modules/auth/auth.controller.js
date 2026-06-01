import prisma from "../../config/prisma.js";
import bcrypt from "bcrypt";
import asyncHandler from "../../utils/asyncHandler.js";
import { generateToken } from "../../utils/token.js";

// REGISTER SCHOOL ADMIN
export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, schoolName, role } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: role || "ADMIN",
      school: {
        create: {
          name: schoolName,
        },
      },
    },
    include: { school: true },
  });

  res.status(201).json({
    message: "User created successfully",
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      school: user.school,
    },
  });
});

// LOGIN
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = generateToken(user);

  res.status(200).json({
    message: "Login successful",
    token,
  });
});
