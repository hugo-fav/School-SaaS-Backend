import prisma from "../../config/prisma.js";
import createHttpError from "../../utils/errors/createHttpError.js";
import { ensureExists } from "../../utils/validations/ensureExists.js";

export const createPromotionHistory = async (data, user) => {
  return prisma.$transaction(async (tx) => {
    const { id: userId, schoolId, role } = user;
    const { enrollmentId, toClassId, status, remark } = data;

    if (!enrollmentId) throw createHttpError(400, "Enrollment ID is required.");
    if (!status) throw createHttpError(400, "Status is required.");

    const enrollment = await tx.enrollment.findFirst({
      where: { id: enrollmentId, session: { schoolId } },
      include: {
        student: { select: { id: true, name: true, email: true } },
        class: true,
        session: true,
      },
    });

    ensureExists(enrollment, "Enrollment");

    if (role !== "ADMIN") {
      throw createHttpError(403, "You are not authorized to promote students.");
    }

    if (enrollment.session.isActive) {
      throw createHttpError(
        400,
        "Student can only be promoted after the academic session has ended",
      );
    }

    const existingPromotion = await tx.promotionHistory.findUnique({
      where: { enrollmentId },
    });

    if (existingPromotion) {
      throw createHttpError(400, "This enrollment has already been promoted.");
    }

    const validStatuses = ["PROMOTED", "REPEATED", "GRADUATED", "WITHDRAWN"];
    if (!validStatuses.includes(status)) {
      throw createHttpError(400, "Invalid promotion status.");
    }

    if ((status === "PROMOTED" || status === "REPEATED") && !toClassId) {
      throw createHttpError(
        400,
        `Destination class is required for ${status === "PROMOTED" ? "promoted" : "repeating"} students.`,
      );
    }

    if ((status === "GRADUATED" || status === "WITHDRAWN") && toClassId) {
      throw createHttpError(
        400,
        `${status} students cannot have a destination class.`,
      );
    }

    let destinationClass = null;
    if (toClassId) {
      destinationClass = await tx.class.findFirst({
        where: { id: toClassId, schoolId },
      });
      ensureExists(destinationClass, "Destination class");
    }

    if (status === "PROMOTED" && destinationClass.id === enrollment.classId) {
      throw createHttpError(
        400,
        "A promoted student must move to a different class.",
      );
    }

    if (status === "REPEATED" && destinationClass.id !== enrollment.classId) {
      throw createHttpError(
        400,
        "Repeated students must remain in the same class.",
      );
    }

    // Score/attendance checks now actually run, and only apply to
    // PROMOTED/REPEATED — a graduating or withdrawing student shouldn't be
    // blocked by missing scores/attendance (they're leaving, not advancing).
    if (status === "PROMOTED" || status === "REPEATED") {
      const scoreCount = await tx.score.count({ where: { enrollmentId } });
      if (scoreCount === 0) {
        throw createHttpError(
          400,
          "This student cannot be promoted because they have no scores recorded for the current session.",
        );
      }

      const attendanceCount = await tx.attendance.count({
        where: { enrollmentId },
      });
      if (attendanceCount === 0) {
        throw createHttpError(
          400,
          "This student cannot be promoted because they have no attendance records for the current session.",
        );
      }
    }

    const promotion = await tx.promotionHistory.create({
      data: {
        enrollmentId,
        fromClassId: enrollment.classId,
        toClassId,
        status,
        remark,
        promotedById: userId,
      },
    });

    // Exactly one Enrollment update, based on status:
    if (status === "PROMOTED" || status === "REPEATED") {
      await tx.enrollment.update({
        where: { id: enrollmentId },
        data: { classId: toClassId },
      });
    } else {
      // GRADUATED or WITHDRAWN — never null out classId; the student's
      // last class remains on record, only their status changes.
      await tx.enrollment.update({
        where: { id: enrollmentId },
        data: {
          status, // "GRADUATED" | "WITHDRAWN" — new field
          leftAt: new Date(), // new field
        },
      });
    }

    return tx.promotionHistory.findUnique({
      where: { id: promotion.id },
      include: {
        enrollment: {
          include: {
            student: { select: { id: true, name: true, email: true } },
            class: true,
            session: true,
          },
        },
        fromClass: true,
        toClass: true,
        promotedBy: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });
  });
};

export const getPromotionHistory = async (filters, user) => {
  const { schoolId } = user;

  const { studentId, fromClassId, toClassId, status, sessionId } = filters;

  const where = {
    enrollment: {
      session: {
        schoolId,
      },
    },
  };

  if (studentId) {
    where.enrollment.studentId = studentId;
  }

  if (fromClassId) {
    where.fromClassId = fromClassId;
  }

  if (toClassId) {
    where.toClassId = toClassId;
  }

  //   promotion status filter
  if (status) {
    where.status = status;
  }

  if (sessionId) {
    where.enrollment.sessionId = sessionId;
  }

  const promotions = await prisma.promotionHistory.findMany({
    where,
    include: {
      enrollment: {
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
      },
      fromClass: true,
      toClass: true,
      promotedBy: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: {
      promotedAt: "desc",
    },
  });

  return promotions;
};

export const getPromotionHistoryById = async (id, user) => {
  const { schoolId } = user;

  const promotion = await prisma.promotionHistory.findFirst({
    where: {
      id,
      enrollment: {
        session: {
          schoolId,
        },
      },
    },
    include: {
      enrollment: {
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
      },
      fromClass: true,
      toClass: true,
      promotedBy: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });

  ensureExists(promotion, "Promotion history");

  return promotion;
};
