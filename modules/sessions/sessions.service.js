import prisma from "../../config/prisma.js";

export const createSession = async (sessionData, schoolId) => {
  return prisma.session.create({
    data: { ...sessionData, schoolId },
  });
};

export const getSessions = async (schoolId) => {
  return prisma.session.findMany({
    where: { schoolId },
  });
};

export const getSession = async (sessionId, schoolId) => {
  return prisma.session.findFirst({
    where: { id: sessionId, schoolId },
  });
};

export const updateSession = async (sessionId, schoolId, updateData) => {
  return prisma.session.updateMany({
    where: { id: sessionId, schoolId },
    data: updateData,
  });
};

export const deleteSession = async (sessionId, schoolId) => {
  return prisma.session.deleteMany({
    where: { id: sessionId, schoolId },
  });
};
