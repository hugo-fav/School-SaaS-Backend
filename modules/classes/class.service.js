import prisma from "../../config/prisma.js";

export const createClass = async (classData, schoolId) => {
  const { name } = classData;

  return prisma.class.create({
    data: { name, schoolId },
  });
};

export const getClasses = async (schoolId) => {
  return prisma.class.findMany({
    where: { schoolId },
  });
};

export const getClass = async (classId, schoolId) => {
  return prisma.class.findFirst({
    where: { id: classId, schoolId },
  });
};

export const updateClass = async (classId, schoolId, updateData) => {
  const { name } = updateData;

  return prisma.class.updateMany({
    where: {
      id: classId,
      schoolId,
    },
    data: {
      name,
    },
  });
};

export const deleteClass = async (classId, schoolId) => {
  return prisma.class.deleteMany({
    where: {
      id: classId,
      schoolId,
    },
  });
};

export const assignTeacherToClass = async (classId, teacherId, schoolId) => {
  const teacher = await prisma.user.findFirst({
    where: {
      id: teacherId,
      schoolId,
      role: "TEACHER",
    },
  });

  const result = await prisma.class.updateMany({
    where: {
      id: classId,
      schoolId,
    },
    data: {
      teacherId,
    },
  });

  return { teacher, result };
};

export const getTeacherClasses = async (teacherId, schoolId) => {
  return prisma.user.findFirst({
    where: {
      id: teacherId,
      schoolId,
      role: "TEACHER",
    },
    include: {
      taughtClasses: true,
    },
  });
};

export const assignStudentToClass = async (classId, studentId, schoolId) => {
  const student = await prisma.user.findFirst({
    where: {
      id: studentId,
      schoolId,
      role: "STUDENT",
    },
  });

  if (!student) {
    return { notFoundStudent: true };
  }

  const classData = await prisma.class.findFirst({
    where: {
      id: classId,
      schoolId,
    },
    include: {
      students: true,
    },
  });

  if (!classData) {
    return { notFoundClass: true };
  }

  const alreadyEnrolled = classData.students?.some((student) => student.id === studentId);

  if (alreadyEnrolled) {
    return { alreadyEnrolled: true };
  }

  const updatedClass = await prisma.class.update({
    where: {
      id: classId,
    },
    data: {
      students: {
        connect: {
          id: studentId,
        },
      },
    },
    include: {
      students: true,
      teacher: true,
    },
  });

  return { updatedClass };
};

export const getClassWithMembers = async (classId) => {
  return prisma.class.findFirst({
    where: {
      id: classId,
    },
    include: {
      teacher: true,
      students: true,
    },
  });
};
