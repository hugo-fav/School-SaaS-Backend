import prisma from "../../config/prisma.js";

const VALID_TERMS = ["First Term", "Second Term", "Third Term"];

export const createTerm = async (data, schoolId) => {
  return prisma.$transaction(async (tx) => {
    const { sessionId, name, isActive } = data;
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    if (!VALID_TERMS.includes(name)) {
      const error = new Error(
        "Invalid term name. Valid names are: First Term, Second Term, Third Term.",
      );
      error.statusCode = 400;
      throw error;
    }

    const session = await tx.academicSession.findFirst({
      where: { id: sessionId, schoolId },
    });

    if (!session) {
      const error = new Error("Academic session not found.");
      error.statusCode = 404;
      throw error;
    }

    if (startDate < session.startDate || endDate > session.endDate) {
      const error = new Error(
        "Term dates must fall within the academic session dates.",
      );
      error.statusCode = 400;
      throw error;
    }

    const existingTerm = await tx.term.findFirst({
      where: { sessionId, name },
    });

    if (existingTerm) {
      const error = new Error("Term already exists.");
      error.statusCode = 400;
      throw error;
    }

    const overlappingTerm = await tx.term.findFirst({
      where: {
        sessionId,
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
    });

    if (overlappingTerm) {
      const error = new Error("Term dates overlap with an existing term.");
      error.statusCode = 400;
      throw error;
    }

    if (isActive === true) {
      await tx.term.updateMany({
        where: { sessionId, isActive: true },
        data: { isActive: false },
      });
    }

    const termCount = await tx.term.count({ where: { sessionId } });

    if (termCount >= 3) {
      const error = new Error("A session can only have a maximum of 3 terms.");
      error.statusCode = 400;
      throw error;
    }

    return tx.term.create({
      data: {
        ...data,
        startDate,
        endDate,
      },
    });
  });
};
export const getTerms = async (schoolId) => {
  return prisma.term.findMany({
    where: {
      session: {
        schoolId,
      },
    },
    include: {
      session: {
        select: {
          id: true,
          name: true,
          isActive: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const getTerm = async (id, schoolId) => {
  return prisma.term.findFirst({
    where: { id, session: { schoolId } },
    include: {
      session: {
        select: {
          id: true,
          name: true,
          startDate: true,
          endDate: true,
          isActive: true,
        },
      },
    },
  });
};

export const updateTerm = async (id, schoolId, data) => {
  return prisma.$transaction(async (tx) => {
    const currentTerm = await tx.term.findFirst({
      where: { id, session: { schoolId } },
    });

    if (!currentTerm) {
      const error = new Error("Term not found.");
      error.statusCode = 404;
      throw error;
    }

    if (data.name) {
      if (!VALID_TERMS.includes(data.name)) {
        const error = new Error(
          "Invalid term name. Valid names are: First Term, Second Term, Third Term.",
        );
        error.statusCode = 400;
        throw error;
      }
    }

    const session = await tx.academicSession.findFirst({
      where: { id: currentTerm.sessionId, schoolId },
    });

    if (!session) {
      const error = new Error("Academic session not found.");
      error.statusCode = 404;
      throw error;
    }

    if (data.name) {
      const existingTerm = await tx.term.findFirst({
        where: {
          sessionId: currentTerm.sessionId,
          name: data.name,
          NOT: { id },
        },
      });

      if (existingTerm) {
        const error = new Error("Term name already exists.");
        error.statusCode = 400;
        throw error;
      }
    }

    // Convert once — used for both validation and the final write
    const startDate = data.startDate
      ? new Date(data.startDate)
      : currentTerm.startDate;
    const endDate = data.endDate ? new Date(data.endDate) : currentTerm.endDate;

    if (startDate >= endDate) {
      const error = new Error("Start date must be earlier than end date.");
      error.statusCode = 400;
      throw error;
    }

    if (startDate < session.startDate || endDate > session.endDate) {
      const error = new Error(
        "Term dates must fall within the academic session dates.",
      );
      error.statusCode = 400;
      throw error;
    }

    const overlappingTerm = await tx.term.findFirst({
      where: {
        sessionId: currentTerm.sessionId,
        NOT: { id },
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
    });

    if (overlappingTerm) {
      const error = new Error("Term dates overlap with an existing term.");
      error.statusCode = 400;
      throw error;
    }

    if (currentTerm.isActive && data.isActive === false) {
      const error = new Error(
        "You cannot deactivate the only active term in the session. Activate another term first before deactivating this one.",
      );
      error.statusCode = 400;
      throw error;
    }

    if (data.isActive === true) {
      await tx.term.updateMany({
        where: {
          sessionId: currentTerm.sessionId,
          isActive: true,
          NOT: { id },
        },
        data: { isActive: false },
      });
    }

    return tx.term.update({
      where: { id },
      data: {
        ...data,
        ...(data.startDate && { startDate }),
        ...(data.endDate && { endDate }),
      },
    });
  });
};

export const deleteTerm = async (id, schoolId) => {
  const term = await prisma.term.findFirst({
    where: { id, session: { schoolId } },
  });

  if (!term) {
    const error = new Error("Term not found.");
    error.statusCode = 404;
    throw error;
  }

  // prevent deleting the active term
  if (term.isActive) {
    const error = new Error("You cannot delete the active term. ");
    error.statusCode = 400;
    throw error;
  }

  return prisma.term.delete({
    where: { id },
  });
};
