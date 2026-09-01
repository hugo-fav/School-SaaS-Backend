import prisma from "../../config/prisma.js";
import { checkTeacherOwnership } from "../../utils/validations/checkTeacherOwnership.js";
import { ensureExists } from "../../utils/validations/ensureExists.js";
import createHttpError from "../../utils/errors/createHttpError.js";
import { validateDateWithinRange } from "../../utils/validations/validateDateWithinRange.js";
import { validatePositiveNumber } from "../../utils/validations/validatePositiveNumber.js";

export const createAssessment = async (data, user) => {
  return prisma.$transaction(async (tx) => {
    const { id: userId, schoolId, role } = user;
    const {
      title,
      description,
      type,
      maxScore,
      dueDate,
      teacherSubjectId,
      termId,
    } = data;

    // Validate title
    if (!title || !title.trim()) {
      const error = new Error("Assessment title is required");
      error.statusCode = 400;
      throw error;
    }

    const normalizedTitle = title.trim().toUpperCase();

    // Validate max score
    if (
      typeof maxScore !== "number" ||
      Number.isNaN(maxScore) ||
      maxScore <= 0
    ) {
      const error = new Error("Maximum score must be greater than zero");
      error.statusCode = 400;
      throw error;
    }

    // Validate TeacherSubject
    const teacherSubject = await tx.teacherSubject.findFirst({
      where: {
        id: teacherSubjectId,
        session: {
          schoolId,
        },
      },
      include: {
        session: true,
        teacher: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!teacherSubject) {
      const error = new Error(
        "Teacher assignment not found or does not belong to your school",
      );
      error.statusCode = 404;
      throw error;
    }

    if (role === "TEACHER" && teacherSubject.teacherId !== userId) {
      const error = new Error(
        "You can only create assessments for your assigned subjects.",
      );
      error.statusCode = 403;
      throw error;
    }

    // Only active academic session
    if (!teacherSubject.session.isActive) {
      const error = new Error(
        "Assessment can only be created for the active academic session",
      );
      error.statusCode = 400;
      throw error;
    }

    // Validate Term
    const term = await tx.term.findFirst({
      where: {
        id: termId,
        session: {
          schoolId,
        },
      },
      include: {
        session: true,
      },
    });

    if (!term) {
      const error = new Error(
        "Term not found or does not belong to  your school.",
      );
      error.statusCode = 404;
      throw error;
    }

    // TeacherSubject and Term must belong to the same academic session
    if (teacherSubject.sessionId !== term.sessionId) {
      const error = new Error(
        "Teacher assignment and term must belong to the same academic session",
      );
      error.statusCode = 400;
      throw error;
    }

    // Only active term
    if (!term.isActive) {
      const error = new Error(
        "Assessments can only be created for the active term",
      );
      error.statusCode = 400;
      throw error;
    }

    //  Due date validation
    if (dueDate) {
      const assessmentDate = new Date(dueDate);

      if (assessmentDate < term.startDate || assessmentDate > term.endDate) {
        const error = new Error("Due date must fall within the selected term");
        error.statusCode = 400;
        throw error;
      }
    }

    // Prevent duplicate assessment
    const existingAssessment = await tx.assessment.findFirst({
      where: {
        teacherSubjectId,
        termId,
        title: normalizedTitle,
      },
    });

    if (existingAssessment) {
      const error = new Error("Assessment with this title already exists");
      error.statusCode = 400;
      throw error;
    }

    return tx.assessment.create({
      data: {
        title: normalizedTitle,
        description,
        type,
        maxScore,
        dueDate,
        teacherSubjectId,
        termId,
      },
      include: {
        teacherSubject: {
          include: {
            teacher: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            subject: true,
            class: true,
            session: true,
          },
        },
        term: true,
      },
    });
  });
};

export const getAssessments = async (schoolId) => {
  return prisma.assessment.findMany({
    where: {
      teacherSubject: {
        session: {
          schoolId,
        },
      },
    },
    include: {
      teacherSubject: {
        include: {
          teacher: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          subject: true,
          class: true,
          session: true,
        },
      },
      term: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const getAssessment = async (id, schoolId) => {
  const assessment = await prisma.assessment.findFirst({
    where: {
      id,
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
          subject: true,
          class: true,
          session: true,
        },
      },
      term: true,
      scores: true,
    },
  });

  if (!assessment) {
    const error = new Error("Assessment not found");
    error.statusCode = 404;
    throw error;
  }

  return assessment;
};

export const updateAssessment = async (id, data, user) => {
  return prisma.$transaction(async (tx) => {
    const { id: userId, schoolId, role } = user;

    const assessment = await tx.assessment.findFirst({
      where: {
        id,
        teacherSubject: {
          session: {
            schoolId,
          },
        },
      },
      include: {
        teacherSubject: {
          include: {
            session: true,
          },
        },
        term: true,
        scores: true,
      },
    });

    ensureExists(assessment, "Assessment");

    // Teacher ownership
    checkTeacherOwnership(role, userId, assessment.teacherSubject.teacherId);

    // Locked once scores exist
    if (assessment.scores.length > 0) {
      throw createHttpError(
        400,
        "Assessment cannot be updated because scores have already been recorded.",
      );
    }

    // Published assessments
    if (assessment.isPublished) {
      const allowedFields = {};

      if (data.description !== undefined)
        allowedFields.description = data.description;

      if (data.dueDate !== undefined) {
        validateDateWithinRange(
          data.dueDate,
          assessment.term.startDate,
          assessment.term.endDate,
          "Due Date",
        );

        allowedFields.dueDate = data.dueDate;
      }

      return tx.assessment.update({
        where: { id },
        data: allowedFields,
        include: {
          teacherSubject: {
            include: {
              teacher: true,
              subject: true,
              class: true,
              session: true,
            },
          },
          term: true,
        },
      });
    }

    // ---------- Draft Assessment ----------

    const updateData = {};

    if (data.description !== undefined)
      updateData.description = data.description;

    if (data.type !== undefined) updateData.type = data.type;

    if (data.maxScore !== undefined) {
      validatePositiveNumber(data.maxScore, "Maximum score");

      updateData.maxScore = data.maxScore;
    }

    let teacherSubject = assessment.teacherSubject;

    if (data.teacherSubjectId) {
      teacherSubject = await tx.teacherSubject.findFirst({
        where: {
          id: data.teacherSubjectId,
          session: {
            schoolId,
          },
        },
        include: {
          session: true,
          teacher: true,
        },
      });

      ensureExists(teacherSubject, "Teacher assignment");

      updateData.teacherSubjectId = teacherSubject.id;
    }

    let term = assessment.term;

    if (data.termId) {
      term = await tx.term.findFirst({
        where: {
          id: data.termId ?? assessment.termId,
          session: {
            schoolId,
          },
        },
        include: {
          session: true,
        },
      });

      ensureExists(term, "Term");

      updateData.termId = term.id;
    }

    // TeacherSubject and Term must belong to the same academic session
    if (teacherSubject.sessionId !== term.sessionId) {
      throw createHttpError(
        400,
        "Teacher assignment and term must belong to the same academic session.",
      );
    }

    // Assessment can only belong to an active academic session
    if (!teacherSubject.session.isActive) {
      throw createHttpError(
        400,
        "Assessments can only belong to the active academic session.",
      );
    }

    // Assessment can only belong to an active term
    if (!term.isActive) {
      throw createHttpError(
        400,
        "Assessments can only belong to the active term.",
      );
    }

    if (data.title !== undefined) {
      const normalizedTitle = data.title.trim();

      if (!normalizedTitle) {
        throw createHttpError(400, "Assessment title is required.");
      }

      const duplicate = await tx.assessment.findFirst({
        where: {
          id: {
            not: id,
          },
          teacherSubjectId:
            data.teacherSubjectId ?? assessment.teacherSubjectId,
          termId: data.termId ?? assessment.termId,
          title: normalizedTitle,
        },
      });

      if (duplicate) {
        throw createHttpError(
          400,
          "Assessment with this title already exists.",
        );
      }

      updateData.title = normalizedTitle;
    }

    if (data.dueDate !== undefined) {
      validateDateWithinRange(
        data.dueDate,
        term.startDate,
        term.endDate,
        "Due Date",
      );

      updateData.dueDate = data.dueDate;
    }

    return tx.assessment.update({
      where: {
        id,
      },
      data: updateData,
      include: {
        teacherSubject: {
          include: {
            teacher: true,
            subject: true,
            class: true,
            session: true,
          },
        },
        term: true,
      },
    });
  });
};

export const deleteAssessment = async (id, user) => {
  return prisma.$transaction(async (tx) => {
    const { id: userId, schoolId, role } = user;

    // find assessment
    const assessment = await tx.assessment.findFirst({
      where: {
        id,
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
          },
        },
        scores: {
          select: {
            id: true,
          },
        },
      },
    });

    ensureExists(assessment, "Assessment");

    // Teacher ownership
    checkTeacherOwnership(role, userId, assessment.teacherSubject.teacherId);

    // Cannot delete published assessment
    if (assessment.isPublished) {
      throw createHttpError(400, "Published assessments cannot be deleted");
    }

    await tx.assessment.delete({
      where: {
        id,
      },
    });

    return;
  });
};

export const publishedAssessmet = async (id, user) => {
  return prisma.$transaction(async (tx) => {
    const { id: userId, schoolId, role } = user;

    const assessment = await tx.assessment.findFirst({
      where: {
        id,
        teacherSubject: {
          session: {
            schoolId,
          },
        },
      },
      include: {
        teacherSubject: {
          include: {
            session: true,
          },
        },
        term: true,
        scores: true,
      },
    });

    ensureExists(assessment, "Assessment");

    // Teacher ownership
    checkTeacherOwnership(role, userId, assessment.teacherSubject.teacherId);

    // Already published
    if (assessment.isPublished) {
      throw createHttpError(400, "Assessment is already published ");
    }

    //  Session must be active
    if (!assessment.teacherSubject.session.isActive) {
      throw createHttpError(
        400,
        "Only assessment in the active academic session can be published",
      );
    }

    //  Term must be active
    if (!assessment.term.isActive) {
      throw createHttpError(
        400,
        "Only Assessments in the active term can be published",
      );
    }

    //  cannot publish if score already exist
    if (assessment.scores.length > 0) {
      throw createHttpError(
        400,
        "Assessment with recorded scores cannot be publised",
      );
    }

    return tx.assessment.update({
      where: {
        id,
      },
      data: {
        isPublished: true,
        publishedAt: new Date(),
      },
      include: {
        teacherSubject: {
          include: {
            teacher: true,
            subject: true,
            class: true,
            session: true,
          },
        },
        term: true,
      },
    });
  });
};

export const unpublishAssessment = async (id, user) => {
  return prisma.$transaction(async (tx) => {
    const { id: userId, schoolId, role } = user;

    const assessment = await tx.assessment.findFirst({
      where: {
        id,
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
          },
        },
        scores: true,
      },
    });

    ensureExists(assessment, "Assessment");

    checkTeacherOwnership(role, userId, assessment.teacherSubject.teacherId);

    if (!assessment.isPublished) {
      throw createHttpError(400, "Assessment is already unpublished");
    }

    if (assessment.scores.length > 0) {
      throw createHttpError(
        400,
        "Assessment cannot be unpublished because scores have already been recorded",
      );
    }

    return tx.assessment.update({
      where: {
        id,
      },
      data: {
        isPublished: false,
        publishedAt: null,
      },
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
    });
  });
};
