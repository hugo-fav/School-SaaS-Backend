import prisma from "../../config/prisma.js";
import createHttpError from "../../utils/errors/createHttpError.js";
import ensureUniqueEnrollments from "../../utils/validations/ensureUniqueEnrollments.js";
import { ensureExists } from "../../utils/validations/ensureExists.js";
import { checkTeacherOwnership } from "../../utils/validations/checkTeacherOwnership.js";
import validateScoreRange from "../../utils/validations/validateScoreRange.js";

export const createBulkScores = async (data, user) => {
  return prisma.$transaction(async (tx) => {
    const { id: userId, schoolId, role } = user;

    const { assessmentId, scores } = data;

    //  Validation
    if (!assessmentId) {
      throw createHttpError(400, "Assessment is requires");
    }

    if (!Array.isArray(scores) || scores.length === 0) {
      throw createHttpError(400, "At least one score must be provided");
    }

    ensureUniqueEnrollments(scores);

    const assessment = await tx.assessment.findFirst({
      where: {
        id: assessmentId,
        teacherSubject: {
          session: {
            schoolId,
          },
        },
      },
      include: {
        teacherSubject: {
          include: {
            teacher: true,
            class: true,
            session: true,
          },
        },
        term: true,
      },
    });

    ensureExists(assessment, "Assessment");

    checkTeacherOwnership(role, userId, assessment.teacherSubject.teacherId);

    if (!assessment.isPublished) {
      throw createHttpError(
        400,
        "Score can only be recorded for published assessments",
      );
    }

    if (!assessment.teacherSubject.session.isActive) {
      throw createHttpError(
        400,
        "Score can only be recorded for the active academic session",
      );
    }

    if (!assessment.term.isActive) {
      throw createHttpError(
        400,
        "Score can only be recorded during the active academic term",
      );
    }

    const enrollmentIds = scores.map((item) => item.enrollmentId);

    const enrollments = await tx.enrollment.findMany({
      where: {
        id: {
          in: enrollmentIds,
        },
        class: {
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
    });

    if (enrollments.length !== enrollmentIds.length) {
      const foundIds = enrollments.map((enrollment) => enrollment.id);

      const missingIds = enrollmentIds.filter((id) => !foundIds.includes(id));

      throw createHttpError(
        404,
        `The following enrollment IDs were not found: ${missingIds.join(", ")}`,
      );
    }

    for (const enrollment of enrollments) {
      if (enrollment.classId !== assessment.teacherSubject.classId) {
        throw createHttpError(
          400,
          `${enrollment.student.name} does not belong to this class`,
        );
      }
    }

    for (const enrollment of enrollments) {
      if (enrollment.sessionId !== assessment.teacherSubject.sessionId) {
        throw createHttpError(
          400,
          `${enrollment.student.name} is enrolled in a different academic session`,
        );
      }
    }

    for (const enrollment of enrollments) {
      if (enrollment.status !== "ACTIVE") {
        throw createHttpError(
          400,
          `${enrollment.student.name}'s enrollment is ${enrollment.status.toLowerCase()} — scores cannot be recorded.`,
        );
      }
    }

    for (const item of scores) {
      validateScoreRange(item.obtainedScore, assessment.maxScore);
    }

    // const existingScores = await tx.score.findMany({
    //   where: {
    //     assessmentId,
    //     enrollmentId: {
    //       in: enrollmentIds,
    //     },
    //   },
    // });

    const existingScores = await tx.score.findMany({
      where: {
        assessmentId,
        enrollmentId: {
          in: enrollmentIds,
        },
      },
      include: {
        enrollment: {
          include: {
            student: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (existingScores.length > 0) {
      const studentNames = existingScores.map(
        (score) => score.enrollment.student.name,
      );

      throw createHttpError(
        400,
        `Scores have already been recorded for: ${studentNames.join(", ")}`,
      );
    }

    //  Save Scores
    const createdScores = await Promise.all(
      scores.map((item) =>
        tx.score.create({
          data: {
            enrollmentId: item.enrollmentId,
            assessmentId,
            obtainedScore: item.obtainedScore,
            remark: item.remark ?? null,
            gradedById: userId,
            gradedAt: new Date(),
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
            assessment: {
              include: {
                teacherSubject: {
                  include: {
                    teacher: {
                      select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                      },
                    },
                    subject: true,
                    class: true,
                    session: true,
                  },
                },
                term: true,
              },
            },
          },
        }),
      ),
    );

    //  Return scores
    return createdScores;
  });
};

export const getScores = async (filters, user) => {
  const { schoolId } = user;

  const { assessmentId, studentId, classId, teacherId, termId, sessionId } =
    filters;

  const where = {
    assessment: {
      teacherSubject: {
        session: {
          schoolId,
        },
      },
    },
  };

  if (assessmentId) {
    where.assessmentId = assessmentId;
  }

  if (studentId) {
    where.enrollment = {
      ...(where.enrollment || {}),
      studentId,
    };
  }

  if (classId) {
    where.assessment.teacherSubject.classId = classId;
  }

  if (teacherId) {
    where.assessment.teacherSubject.teacherId = teacherId;
  }

  if (termId) {
    where.assessment.termId = termId;
  }

  if (sessionId) {
    where.assessment.teacherSubject.sessionId = sessionId;
  }

  const scores = await prisma.score.findMany({
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
      assessment: {
        include: {
          teacherSubject: {
            include: {
              teacher: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                },
              },
              subject: true,
              class: true,
              session: true,
            },
          },
          term: true,
        },
      },
      gradedBy: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (scores.length === 0) {
    throw createHttpError(404, "No scores found.");
  }

  return scores;
};

export const getScoreById = async (id, schoolId) => {
  const score = await prisma.score.findFirst({
    where: {
      id,
      assessment: { teacherSubject: { session: { schoolId } } },
    },
    include: {
      enrollment: {
        include: {
          student: { select: { id: true, name: true, email: true } },
          class: true,
          session: true,
        },
      },
      assessment: {
        include: {
          teacherSubject: {
            include: {
              teacher: {
                select: { id: true, name: true, email: true, role: true },
              },
              subject: true,
              class: true,
              session: true,
            },
          },
          term: true,
        },
      },
      gradedBy: { select: { id: true, name: true, email: true, role: true } },
    },
  });

  ensureExists(score, "Score");

  return score;
};

export const updateScore = async (id, user, data) => {
  return prisma.$transaction(async (tx) => {
    const { id: userId, schoolId, role } = user;

    const score = await tx.score.findFirst({
      where: {
        id,
        assessment: {
          teacherSubject: {
            session: {
              schoolId,
            },
          },
        },
      },
      include: {
        assessment: {
          include: {
            teacherSubject: {
              include: {
                teacher: true,
                session: true,
              },
            },
            term: true,
          },
        },
        enrollment: {
          include: {
            student: true,
          },
        },
      },
    });

    ensureExists(score, "Score");

    checkTeacherOwnership(
      role,
      userId,
      score.assessment.teacherSubject.teacherId,
    );

    if (!score.assessment.teacherSubject.session.isActive) {
      throw createHttpError(
        400,
        "Scores can only be updated during the active academic session",
      );
    }

    if (!score.assessment.term.isActive) {
      throw createHttpError(
        400,
        "Scores can only be updated during the active academic term",
      );
    }

    if (!score.assessment.isPublished) {
      throw createHttpError(
        400,
        "Scores can only be updated for published assessments.",
      );
    }

    validateScoreRange(data.obtainedScore, score.assessment.maxScore);

    const updateData = {};

    if (data.obtainedScore !== undefined)
      updateData.obtainedScore = data.obtainedScore;

    if (data.remark !== undefined) {
      updateData.remark = data.remark;
    }

    updateData.gradedAt = new Date();

    return tx.score.update({
      where: { id },
      data: updateData,
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
        assessment: {
          include: {
            teacherSubject: {
              include: {
                teacher: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                  },
                },
                subject: true,
                class: true,
                session: true,
              },
            },
            term: true,
          },
        },
        gradedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  });
};

export const deleteScore = async (id, user) => {
  const { id: userId, schoolId, role } = user;

  return prisma.$transaction(async (tx) => {
    const score = await tx.score.findFirst({
      where: {
        id,
        assessment: {
          teacherSubject: {
            session: {
              schoolId,
            },
          },
        },
      },
      include: {
        assessment: {
          include: {
            teacherSubject: {
              include: {
                teacher: true,
                session: true,
              },
            },
            term: true,
          },
        },
      },
    });

    ensureExists(score, "Score");

    checkTeacherOwnership(
      role,
      userId,
      score.assessment.teacherSubject.teacherId,
    );

    if (!score.assessment.teacherSubject.session.isActive) {
      throw createHttpError(
        400,
        "Score cannot be deleted after the academic session has ended",
      );
    }

    if (!score.assessment.term.isActive) {
      throw createHttpError(
        400,
        "Scores cannot be deleted after the academic term has ended",
      );
    }

    if (!score.assessment.isPublished) {
      throw createHttpError(
        400,
        "Scores can only be deleted for published assessment.",
      );
    }

    await tx.score.delete({
      where: {
        id,
      },
    });

    return;
  });
};
