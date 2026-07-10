import prisma from "../../config/prisma.js";

export const createSubject = async (subjectData, schoolId) => {
  return prisma.subject.create({
    data: { ...subjectData, schoolId },
  });
};

export const getSubjects = async (schoolId) => {
  return prisma.subject.findMany({
    where: { schoolId },
  });
};

export const getSubject = async (subjectId, schoolId) => {
  return prisma.subject.findFirst({
    where: { id: subjectId, schoolId },
  });
};

export const updateSubject = async (subjectId, schoolId, updateData) => {
  return prisma.subject.updateMany({
    where: { id: subjectId, schoolId },
    data: updateData,
  });
};

export const deleteSubject = async (subjectId, schoolId) => {
  return prisma.subject.deleteMany({
    where: { id: subjectId, schoolId },
  });
};
