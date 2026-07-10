import prisma from "../../config/prisma.js";

export const createTeacherSubject = async (teacherSubjectData, schoolId) => {
  return prisma.teacherSubject.create({
    data: { ...teacherSubjectData, schoolId },
  });
};

export const getTeacherSubjects = async (schoolId) => {
  return prisma.teacherSubject.findMany({
    where: { schoolId },
  });
};

export const getTeacherSubject = async (teacherSubjectId, schoolId) => {
  return prisma.teacherSubject.findFirst({
    where: { id: teacherSubjectId, schoolId },
  });
};

export const updateTeacherSubject = async (
  teacherSubjectId,
  schoolId,
  updateData,
) => {
  return prisma.teacherSubject.updateMany({
    where: { id: teacherSubjectId, schoolId },
    data: updateData,
  });
};

export const deleteTeacherSubject = async (teacherSubjectId, schoolId) => {
  return prisma.teacherSubject.deleteMany({
    where: { id: teacherSubjectId, schoolId },
  });
};
