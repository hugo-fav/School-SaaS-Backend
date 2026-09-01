import prisma from "../../config/prisma.js";
import createHttpError from "../../utils/errors/createHttpError.js";

import groupScoresBySubject from "../../utils/results/groupScoreBySubject.js";
import calculateSubjectResults from "../../utils/results/calculateSubjectResults.js";
import calculateOverallResult from "../../utils/results/calculateOverallResults.js";

import { ensureExists } from "../../utils/validations/ensureExists.js";
import calculateClassPosition from "../../utils/results/calculateClassPosition.js";
import calculateClassStatistics from "../../utils/results/calculateClassStatistics.js";

export const getStudentResults = async (studentId, sessionId, termId, user) => {
  // Ensure the student exists and belongs to the same school as the user

  const { schoolId } = user;

  //   const student = await prisma.student.findUnique({
  //     where: { id: studentId },
  //     include: { user: true },
  //   });

  if (!studentId) {
    throw createHttpError(400, "Student not found");
  }

  if (!sessionId) {
    throw createHttpError(400, "Session ID is required");
  }

  if (!termId) {
    throw createHttpError(400, "Term ID is required");
  }

  //   Fetch the results for the student
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      studentId,
      sessionId,
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
  });

  ensureExists(enrollment, "Enrollment");

  const scores = await prisma.score.findMany({
    where: {
      enrollmentId: enrollment.id,
      assessment: {
        termId,

        teacherSubject: {
          sessionId,
        },
      },
    },
    include: {
      assessment: {
        include: {
          teacherSubject: {
            include: {
              subject: true,

              teacher: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      },
    },

    orderBy: {
      assessment: {
        createdAt: "asc",
      },
    },
  });

  const groupedSubjects = groupScoresBySubject(scores);

  const subjectResults = calculateSubjectResults(groupedSubjects);

  const { totalSubjects, totalObtained, totalPossible, average, overallGrade } =
    calculateOverallResult(subjectResults);

  const term = await prisma.term.findFirst({
    where: {
      id: termId,
      sessionId,
    },
  });

  ensureExists(term, "Term");

  const classEnrollment = await prisma.enrollment.findMany({
    where: {
      classId: enrollment.classId,
      sessionId,
    },
    include: {
      student: {
        select: {
          id: true,
          name: true,
        },
      },
      scores: {
        where: {
          assessment: {
            termId,
          },
        },
        include: {
          assessment: {
            select: {
              maxScore: true,
            },
          },
        },
      },
    },
  });

  const classPosition = calculateClassPosition(classEnrollment, studentId);

  const classStatistics = calculateClassStatistics(classEnrollment);

  return {
    student: enrollment.student,
    class: enrollment.class,
    session: enrollment.session,
    term,

    totalSubjects,
    totalObtained,
    totalPossible,
    average,
    overallGrade,

    classPosition: classPosition.position,
    classStatistics,

    subjects: subjectResults,
  };
};
