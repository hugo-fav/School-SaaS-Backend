import prisma from "../../config/prisma.js";

export const createFee = async ({
  name,
  description,
  amount,
  sessionId,
  termId,
  classId,
  schoolId,
}) => {
  // 1. Make sure the session belongs to this school
  const session = await prisma.academicSession.findFirst({
    where: {
      id: sessionId,
      schoolId,
    },
  });

  if (!session) {
    throw new Error("Academic session not found");
  }

  // 2. If a term was provided, make sure it belongs to the session
  if (termId) {
    const term = await prisma.term.findFirst({
      where: {
        id: termId,
        sessionId,
      },
    });

    if (!term) {
      throw new Error("Term does not belong to this academic session");
    }
  }

  // 3. If a class was provided, make sure it belongs to this school
  if (classId) {
    const schoolClass = await prisma.class.findFirst({
      where: {
        id: classId,
        schoolId,
      },
    });

    if (!schoolClass) {
      throw new Error("Class not found");
    }
  }

  // 4. Create the fee
  const fee = await prisma.fee.create({
    data: {
      name,
      description,
      amount,
      schoolId,
      sessionId,
      termId: termId || null,
      classId: classId || null,
    },

    include: {
      session: true,
      term: true,
      class: true,
    },
  });

  return fee;
};

export const getFees = async ({ schoolId, sessionId, termId, classId }) => {
  const where = {
    schoolId,
  };

  if (sessionId) {
    where.sessionId = sessionId;
  }

  if (termId) {
    where.termId = termId;
  }

  if (classId) {
    where.classId = classId;
  }

  return prisma.fee.findMany({
    where,

    include: {
      session: true,
      term: true,
      class: true,
    },

    orderBy: {
      createdAt: "desc",
    },
  });
};

export const getFeeById = async (id, schoolId) => {
  return prisma.fee.findFirst({
    where: {
      id,
      schoolId,
    },

    include: {
      session: true,
      term: true,
      class: true,
      invoices: true,
    },
  });
};

export const updateFee = async (
  id,
  { name, description, amount, sessionId, termId, classId },
  schoolId,
) => {
  // 1. Find existing fee
  const existingFee = await prisma.fee.findFirst({
    where: {
      id,
      schoolId,
    },
  });

  if (!existingFee) {
    throw new Error("Fee not found");
  }

  /*
   * Determine the final values that will exist
   * after the update.
   */
  const finalSessionId =
    sessionId !== undefined ? sessionId : existingFee.sessionId;

  const finalTermId = termId !== undefined ? termId : existingFee.termId;

  const finalClassId = classId !== undefined ? classId : existingFee.classId;

  // 2. Validate the final session
  const session = await prisma.academicSession.findFirst({
    where: {
      id: finalSessionId,
      schoolId,
    },
  });

  if (!session) {
    throw new Error("Academic session not found");
  }

  // 3. Validate the final term
  if (finalTermId) {
    const term = await prisma.term.findFirst({
      where: {
        id: finalTermId,
        sessionId: finalSessionId,
      },
    });

    if (!term) {
      throw new Error("Term does not belong to the selected academic session");
    }
  }

  // 4. Validate the final class
  if (finalClassId) {
    const schoolClass = await prisma.class.findFirst({
      where: {
        id: finalClassId,
        schoolId,
      },
    });

    if (!schoolClass) {
      throw new Error("Class not found");
    }
  }

  /*
   * 5. Don't allow changes that would make
   * existing invoices inconsistent.
   */
  const invoiceCount = await prisma.invoice.count({
    where: {
      feeId: id,
    },
  });

  if (
    invoiceCount > 0 &&
    (sessionId !== undefined ||
      termId !== undefined ||
      classId !== undefined ||
      amount !== undefined)
  ) {
    throw new Error(
      "This fee cannot have its session, term, class, or amount changed because invoices have already been created",
    );
  }

  // 6. Update fee
  return prisma.fee.update({
    where: {
      id,
    },

    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(amount !== undefined && { amount }),
      ...(sessionId !== undefined && { sessionId }),
      ...(termId !== undefined && { termId }),
      ...(classId !== undefined && { classId }),
    },

    include: {
      session: true,
      term: true,
      class: true,
    },
  });
};

export const deleteFee = async (id, schoolId) => {
  const existingFee = await prisma.fee.findFirst({
    where: {
      id,
      schoolId,
    },

    include: {
      invoices: true,
    },
  });

  if (!existingFee) {
    throw new Error("Fee not found");
  }

  if (existingFee.invoices.length > 0) {
    throw new Error(
      "This fee cannot be deleted because invoices have already been created",
    );
  }

  return prisma.fee.delete({
    where: {
      id,
    },
  });
};
