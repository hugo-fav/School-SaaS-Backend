import prisma from "../../config/prisma.js";
import bcrypt from "bcrypt";

export const createTeacher = async (teacherData, schoolId) => {
  const { name, email, password } = teacherData;

  const hashedPassword = await bcrypt.hash(password, 10);

  return prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: "TEACHER",
      schoolId,
    },
  });
};

export const getTeachers = async (schoolId) => {
  return prisma.user.findMany({
    where: {
      role: "TEACHER",
      schoolId,
    },
  });
};

export const getTeacher = async (teacherId, schoolId) => {
  return prisma.user.findFirst({
    where: {
      id: teacherId,
      role: "TEACHER",
      schoolId,
    },
  });
};

export const updateTeacher = async (teacherId, schoolId, updateData) => {
  const { name, email } = updateData;

  return prisma.user.updateMany({
    where: {
      id: teacherId,
      role: "TEACHER",
      schoolId,
    },
    data: {
      name,
      email,
    },
  });
};

export const deleteTeacher = async (teacherId, schoolId) => {
  return prisma.user.deleteMany({
    where: {
      id: teacherId,
      role: "TEACHER",
      schoolId,
    },
  });
};

export const getMyProfile = async (teacherId, schoolId) => {
  return prisma.user.findFirst({
    where: {
      id: teacherId,
      schoolId,
      role: "TEACHER",
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });
};

export const getMyClasses = async (teacherId, schoolId) => {
  return prisma.class.findMany({
    where: {
      teacherId,
      schoolId,
    },
    select: {
      id: true,
      name: true,
      createdAt: true,
    },
    orderBy: {
      name: "asc",
    },
  });
};

export const getMyStudents = async (teacherId, schoolId) => {
  const classes = await prisma.class.findMany({
    where: {
      teacherId,
      schoolId,
    },
    include: {
      students: {
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      },
    },
  });

  return classes;
};
