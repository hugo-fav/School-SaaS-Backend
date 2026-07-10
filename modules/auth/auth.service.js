import prisma from "../../config/prisma.js";
import bcrypt from "bcrypt";
import { generateToken } from "../../utils/token.js";

export const registerUser = async (userData) => {
  const { name, email, password, schoolName, role } = userData;

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
  });

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    const error = new Error("Invalid credentials");
    error.statusCode = 401;
    throw error;
  }

  const token = generateToken(user);

  return { user, token };
};
