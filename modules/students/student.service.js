import prisma from "../../config/prisma.js";
import bcrypt from "bcrypt";

export const createStudent = async (studentData, schoolId) => {
  const { name, email, password } = studentData;

  const hashedPassword = await bcrypt.hash(password, 10);

  return prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: "STUDENT",
      schoolId,
    },
  });
};

export const getStudents = async (schoolId) => {
  return prisma.user.findMany({
    where: {
      role: "STUDENT",
      schoolId,
    },
  });
};

export const getStudent = async (studentId, schoolId) => {
  return prisma.user.findFirst({
    where: {
      id: studentId,
      role: "STUDENT",
      schoolId,
    },
  });
};

export const updateStudent = async (studentId, schoolId, updateData) => {
  const { name, email } = updateData;

  return prisma.user.updateMany({
    where: {
      id: studentId,
      role: "STUDENT",
      schoolId,
    },
    data: {
      name,
      email,
    },
  });
};

export const deleteStudent = async (studentId, schoolId) => {
  return prisma.user.deleteMany({
    where: {
      id: studentId,
      role: "STUDENT",
      schoolId,
    },
  });
};
