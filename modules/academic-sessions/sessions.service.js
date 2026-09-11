import prisma from "../../config/prisma.js";

// Create Academic Session
export const createSession = async (data, schoolId) => {
  return prisma.$transaction(async (tx) => {
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    const existingSession = await tx.academicSession.findFirst({
      where: {
        schoolId,
        name: data.name,
      },
    });

    if (existingSession) {
      const error = new Error("Academic session already exists.");
      error.statusCode = 400;
      throw error;
    }

    const overlappingSession = await tx.academicSession.findFirst({
      where: {
        schoolId,
        startDate: {
          lte: endDate,
        },
        endDate: {
          gte: startDate,
        },
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
        where: {
          schoolId,
          isActive: true,
        },
        data: {
          isActive: false,
        },
      });
    }

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

export const updateSession = async (id, schoolId, data) => {
  return prisma.$transaction(async (tx) => {
    // Check if the session exists
    const currentSession = await tx.academicSession.findFirst({
      where: {
        id,
        schoolId,
      },
    });

    if (!currentSession) {
      const error = new Error("Academic session not found.");
      error.statusCode = 404;
      throw error;
    }

    // Prevent duplicate session names
    if (data.name) {
      const existingSession = await tx.academicSession.findFirst({
        where: {
          schoolId,
          name: data.name,
          NOT: {
            id,
          },
        },
      });

      if (existingSession) {
        const error = new Error("Academic session already exists.");
        error.statusCode = 400;
        throw error;
      }
    }

    // Determine which dates to validate
    const startDate = new Date(data.startDate ?? currentSession.startDate);
    const endDate = new Date(data.endDate ?? currentSession.endDate);

    // Prevent overlapping sessions
    const overlappingSession = await tx.academicSession.findFirst({
      where: {
        schoolId,
        NOT: {
          id,
        },
        startDate: {
          lte: endDate,
        },
        endDate: {
          gte: startDate,
        },
      },
    });

    if (overlappingSession) {
      const error = new Error(
        "Academic session dates overlap with another session.",
      );
      error.statusCode = 400;
      throw error;
    }

    // Prevent deactivating the only active session
    if (currentSession.isActive && data.isActive === false) {
      const error = new Error(
        "You cannot deactivate the active session. Activate another session first.",
      );
      error.statusCode = 400;
      throw error;
    }

    // If this session is being activated,
    // deactivate every other active session
    if (data.isActive === true) {
      await tx.academicSession.updateMany({
        where: {
          schoolId,
          isActive: true,
          NOT: {
            id,
          },
        },
        data: {
          isActive: false,
        },
      });
    }

    // Update the session
    return tx.academicSession.update({
      where: {
        id,
      },
      data,
    });
  });
};

export const deleteSession = async (id, schoolId) => {
  const session = await prisma.academicSession.findFirst({
    where: {
      id,
      schoolId,
    },
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
    where: {
      id,
    },
  });
};
