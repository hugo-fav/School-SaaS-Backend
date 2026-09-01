import prisma from "../../config/prisma.js";

import createHttpError from "../../utils/errors/createHttpError.js";
import { ensureExists } from "../../utils/validations/ensureExists.js";

export const createEnrollment = async (data, user) => {
  return prisma.$transaction(async (tx) => {
    const { schoolId } = user;

    const { studentId, classId, sessionId } = data;

    // validations
    const student = await tx.user.findFirst({
      where: {
        id: studentId,
        schoolId,
        role: "STUDENT",
      },
    });

    if (!student) {
      throw createHttpError(
        404,
        "Student not found or does not belong to your school",
      );
    }

    const classRoom = await tx.class.findFirst({
      where: {
        id: classId,
        schoolId,
      },
    });

    if (!classRoom) {
      throw createHttpError(
        404,
        "Class room not found or does not blong to your school",
      );
    }

    const session = await tx.academicSession.findFirst({
      where: {
        id: sessionId,
        schoolId,
      },
    });

    if (!session) {
      throw createHttpError(
        404,
        "Academic session not found or does not belong to your school",
      );
    }

    if (!session.isActive) {
      throw createHttpError(
        400,
        "Students can only be enrolled into the active academic session",
      );
    }

    const existingEnrollment = await tx.enrollment.findFirst({
      where: {
        studentId,
        sessionId,
      },
    });

    if (existingEnrollment) {
      throw createHttpError(
        400,
        "Student is already enrolled in this academic session",
      );
    }

    return tx.enrollment.create({
      data: {
        studentId,
        classId,
        sessionId,
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        class: true,
        session: true,
      },
    });
  });
};

export const getEnrollments = async (schoolId) => {
  const enrollments = await prisma.enrollment.findMany({
    where: {
      session: {
        schoolId,
      },
    },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      class: true,
      session: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!enrollments) {
    throw createHttpError(404, "Enrollments not found");
  }

  return enrollments;
};

export const getEnrollment = async (id, schoolId) => {
  return prisma.enrollment.findFirst({
    where: {
      id,
      session: {
        schoolId,
      },
    },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      class: true,
      session: true,
      scores: true,
      attendance: true,
    },
  });

  ensureExists(enrollments, "Enrollment");

  return enrollment;
};

export const updateEnrollment = async (id, data, user) => {
  return prisma.$transaction(async (tx) => {
    const { schoolId } = user;
    const { classId } = data;

    // VALIDATIONS
    const enrollment = await tx.enrollment.findFirst({
      where: {
        id,
        session: {
          schoolId,
        },
      },
      include: {
        scores: true,
        attendance: true,
      },
    });

    ensureExists(enrollment, "Enrollment");

    if (enrollment.scores.length > 0 || enrollment.attendance.length > 0) {
      throw createHttpError(
        400,
        "Enrollment cannot be updated because scores or attendance have aleady been recorded",
      );
    }

    const classRoom = await tx.class.findFirst({
      where: {
        id: classId,
        schoolId,
      },
    });

    ensureExists(classRoom, "Class");

    if (!classId) {
      throw createHttpError(400, "Class is required");
    }

    if (classId === enrollment.classId) {
      throw createHttpError(400, "Sudent is already enrolled in this class");
    }

    return tx.enrollment.update({
      where: {
        id,
      },
      data: {
        classId,
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        class: true,
        session: true,
      },
    });
  });
};

export const deleteEnrollment = async (id, user) => {
  return prisma.$transaction(async (tx) => {
    const { schoolId } = user;

    const enrollment = await tx.enrollment.findFirst({
      where: {
        id,
        session: {
          schoolId,
        },
      },
      include: {
        scores: true,
        attendance: true,
        promotions: true,
      },
    });

    ensureExists(enrollment, "Enrollment");

    if (enrollment.scores.length > 0) {
      throw createHttpError(
        400,
        "Enrollment cannot be deleted because scores have already been recorded.",
      );
    }

    if (enrollment.attendance.length > 0) {
      throw createHttpError(
        400,
        "Enrollment cannot be deleted because attendance has already been recorded",
      );
    }

    if (enrollment.promotions.length > 0) {
      throw createHttpError(
        400,
        "Enrollment cannot be deleted because promotion history already exists.",
      );
    }

    await tx.enrollment.delete({
      where: {
        id,
      },
    });

    return {
      message: "Enrollment deleted sucessfully",
    };
  });
};
