import prisma from "../../config/prisma.js";

export const createScore = async (scoreData, schoolId) => {
  return prisma.score.create({
    data: { ...scoreData, schoolId },
  });
};

export const getScores = async (schoolId) => {
  return prisma.score.findMany({
    where: { schoolId },
  });
};

export const getScore = async (scoreId, schoolId) => {
  return prisma.score.findFirst({
    where: { id: scoreId, schoolId },
  });
};

export const updateScore = async (scoreId, schoolId, updateData) => {
  return prisma.score.updateMany({
    where: { id: scoreId, schoolId },
    data: updateData,
  });
};

export const deleteScore = async (scoreId, schoolId) => {
  return prisma.score.deleteMany({
    where: { id: scoreId, schoolId },
  });
};
