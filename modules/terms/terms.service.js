import prisma from "../../config/prisma.js";

const VALID_TERMS = ["First Term", "Second Term", "Third Term"];

export const createTerm = async (data, schoolId) => {
  return prisma.$transaction(async (tx) => {
    const { sessionId, name, startDate, endDate, isActive } = data;

    if (!VALID_TERMS.includes(name)) {
      const error = new Error(
        "Invalid term name. Valid names are: First Term, Second Term, Third Term.",
      );
      error.statusCode = 400;
      throw error;
    }

    // Check if the term already exists for the given session and school
    const session = await tx.academicSession.findFirst({
      where: { id: sessionId, schoolId },
    });

    if (!session) {
      const error = new Error("Academic session not found.");
      error.statusCode = 404;
      throw error;
    }

    //  Ensure that dates fall within the academic session
    if (
      new Date(startDate) < session.startDate ||
      new Date(endDate) > session.endDate
    ) {
      const error = new Error(
        "Term dates must fall within the academic session dates.",
      );
      error.statusCode = 400;
      throw error;
    }

    // Prevent duplicate term names within the same session
    const existingTerm = await tx.term.findFirst({
      where: {
        sessionId,
        name,
      },
    });

    if (existingTerm) {
      const error = new Error("Term already exists.");
      error.statusCode = 400;
      throw error;
    }

    // prevent overlapping term dates
    const overlappingTerm = await tx.term.findFirst({
      where: {
        sessionId,
        startDate: { lte: new Date(endDate) },
        endDate: { gte: new Date(startDate) },
      },
    });

    if (overlappingTerm) {
      const error = new Error("Term dates overlap with an existing term.");
      error.statusCode = 400;
      throw error;
    }

    // only one active term per session
    if (isActive === true) {
      await tx.term.updateMany({
        where: { sessionId, isActive: true },
        data: { isActive: false },
      });
    }

    const termCount = await tx.term.count({
      where: { sessionId },
    });

    if (termCount >= 3) {
      const error = new Error("A session can only have a maximum of 3 terms.");
      error.statusCode = 400;
      throw error;
    }

    return tx.term.create({
      data: {
        ...data,
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
    // check if the term exists and belongs to the school
    const currentTerm = await tx.term.findFirst({
      where: { id, session: { schoolId }},
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

    // get the academic session
    const session = await tx.academicSession.findFirst({
      where: { id: currentTerm.sessionId, schoolId },
    });

    if (!session) {
      const error = new Error("Academic session not found.");
      error.statusCode = 404;
      throw error;
    }

    // prevent duplicate term names
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

    // determine date after update
    const startDate = data.startDate ?? currentTerm.startDate;
    const endDate = data.endDate ?? currentTerm.endDate;

    // Ensure date are valid
    if (startDate >= endDate) {
      const error = new Error("Start date must be earlier than end date.");
      error.statusCode = 400;
      throw error;
    }

    // Ensure that dates fall within the academic session
    if (
      new Date(startDate) < session.startDate ||
      new Date(endDate) > session.endDate
    ) {
      const error = new Error(
        "Term dates must fall within the academic session dates.",
      );
      error.statusCode = 400;
      throw error;
    }

    // prevent overlapping term dates
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

    // prevent deactivation of the only active
    if (currentTerm.isActive && data.isActive === false) {
      const error = new Error(
        "You cannot deactivate the only active term in the session. Activate another term first before deactivating this one.",
      );
      error.statusCode = 400;
      throw error;
    }

    // Activate this term and deactivate others
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

    // update the term
    return tx.term.update({
      where: { id },
      data: data,
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
