import prisma from "../../config/prisma.js";

// Create Academic Session
export const createSession = async (data, schoolId) => {
  return prisma.$transaction(async (tx) => {
    // 1. Force actual Date objects so Prisma doesn't crash
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    const existingSession = await tx.academicSession.findFirst({
      where: { schoolId, name: data.name },
    });

    if (existingSession) {
      const error = new Error("Academic session already exists.");
      error.statusCode = 400;
      throw error;
    }

    const overlappingSession = await tx.academicSession.findFirst({
      where: {
        schoolId,
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
    });

    if (overlappingSession) {
      const error = new Error(
        "Academic session dates overlap with an existing session.",
      );
      error.statusCode = 400;
      throw error;
    }

    if (data.isActive) {
      await tx.academicSession.updateMany({
        where: { schoolId, isActive: true },
        data: { isActive: false },
      });
    }

    // Pass the newly parsed Date objects, NOT the raw strings from 'data'
    return tx.academicSession.create({
      data: {
        ...data,
        startDate,
        endDate,
        schoolId,
      },
    });
  });
};

export const getSessions = async (schoolId) => {
  return prisma.academicSession.findMany({
    where: { schoolId },
    orderBy: { createdAt: "desc" },
  });
};

export const getSession = async (id, schoolId) => {
  return prisma.academicSession.findFirst({
    where: { id, schoolId },
  });
};

// Update Academic Session
export const updateSession = async (id, schoolId, data) => {
  return prisma.$transaction(async (tx) => {
    const currentSession = await tx.academicSession.findFirst({
      where: { id, schoolId },
    });

    if (!currentSession) {
      const error = new Error("Academic session not found.");
      error.statusCode = 404;
      throw error;
    }

    if (data.name && data.name !== currentSession.name) {
      const existingSession = await tx.academicSession.findFirst({
        where: { schoolId, name: data.name, NOT: { id } },
      });

      if (existingSession) {
        const error = new Error("Academic session name already exists.");
        error.statusCode = 400;
        throw error;
      }
    }

    // Safely parse dates, falling back to what is already in the database
    const startDate = data.startDate
      ? new Date(data.startDate)
      : currentSession.startDate;
    const endDate = data.endDate
      ? new Date(data.endDate)
      : currentSession.endDate;

    const overlappingSession = await tx.academicSession.findFirst({
      where: {
        schoolId,
        NOT: { id },
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
    });

    if (overlappingSession) {
      const error = new Error(
        "Academic session dates overlap with another session.",
      );
      error.statusCode = 400;
      throw error;
    }

    if (currentSession.isActive && data.isActive === false) {
      const error = new Error(
        "You cannot deactivate the active session directly. Activate another session instead.",
      );
      error.statusCode = 400;
      throw error;
    }

    if (data.isActive === true && !currentSession.isActive) {
      await tx.academicSession.updateMany({
        where: { schoolId, isActive: true, NOT: { id } },
        data: { isActive: false },
      });
    }

    return tx.academicSession.update({
      where: { id },
      data: {
        ...data,
        startDate,
        endDate,
      },
    });
  });
};

export const deleteSession = async (id, schoolId) => {
  const session = await prisma.academicSession.findFirst({
    where: { id, schoolId },
  });

  if (!session) {
    const error = new Error("Academic session not found");
    error.statusCode = 404;
    throw error;
  }

  if (session.isActive) {
    const error = new Error("You cannot delete the active academic session.");
    error.statusCode = 400;
    throw error;
  }

  return prisma.academicSession.delete({
    where: { id },
  });
};
