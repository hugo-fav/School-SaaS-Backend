import prisma from "../../config/prisma.js";

export const createAssessment = async (assessmentData, schoolId) => {
  return prisma.assessment.create({
    data: { ...assessmentData, schoolId },
  });
};

export const getAssessments = async (schoolId) => {
  return prisma.assessment.findMany({
    where: { schoolId },
  });
};

export const getAssessment = async (assessmentId, schoolId) => {
  return prisma.assessment.findFirst({
    where: { id: assessmentId, schoolId },
  });
};

export const updateAssessment = async (assessmentId, schoolId, updateData) => {
  return prisma.assessment.updateMany({
    where: { id: assessmentId, schoolId },
    data: updateData,
  });
};

export const deleteAssessment = async (assessmentId, schoolId) => {
  return prisma.assessment.deleteMany({
    where: { id: assessmentId, schoolId },
  });
};
