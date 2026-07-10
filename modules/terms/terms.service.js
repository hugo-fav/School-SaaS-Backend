import prisma from "../../config/prisma.js";

export const createTerm = async (termData, schoolId) => {
  return prisma.term.create({
    data: { ...termData, schoolId },
  });
};

export const getTerms = async (schoolId) => {
  return prisma.term.findMany({
    where: { schoolId },
  });
};

export const getTerm = async (termId, schoolId) => {
  return prisma.term.findFirst({
    where: { id: termId, schoolId },
  });
};

export const updateTerm = async (termId, schoolId, updateData) => {
  return prisma.term.updateMany({
    where: { id: termId, schoolId },
    data: updateData,
  });
};

export const deleteTerm = async (termId, schoolId) => {
  return prisma.term.deleteMany({
    where: { id: termId, schoolId },
  });
};
