import prisma from "../../config/prisma.js";
import bcrypt from "bcrypt";
import { generateToken } from "../../utils/token.js";

export const registerUser = async (userData) => {
  const { name, email, password, schoolName } = userData;

  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    const error = new Error("An account with this email already exists");
    error.statusCode = 409;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: "ADMIN", // registration always creates a school admin
      school: {
        create: {
          name: schoolName,
        },
      },
    },
    include: { school: true },
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    school: user.school,
  };
};

export const loginUser = async (loginData) => {
  const { email, password } = loginData;

  const user = await prisma.user.findUnique({
    where: { email },
    include: { school: true },
  });

  if (!user) {
    const error = new Error("Invalid credentials");
    error.statusCode = 401;
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    const error = new Error("Invalid credentials");
    error.statusCode = 401;
    throw error;
  }

  if (!user.isActive) {
    const error = new Error("This account has been deactivated");
    error.statusCode = 403;
    throw error;
  }

  if (!user.school.isActive) {
    const error = new Error("This school's account is currently deactivated");
    error.statusCode = 403;
    throw error;
  }

  const token = generateToken(user);
  const { password: _password, ...safeUser } = user;

  return { user: safeUser, token };
};
