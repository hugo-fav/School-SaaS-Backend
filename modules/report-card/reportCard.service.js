import prisma from "../../config/prisma.js";
import createHttpError from "../../utils/errors/createHttpError.js";
import getAttendanceSummary from "../../utils/calculations/getAttendanceSummary.js";
import { ensureExists } from "../../utils/validations/ensureExists.js";
import { getStudentResults } from "../result/result.service.js";

export const generateReportCard = async (data, user) => {
  const { schoolId } = user;
  const { studentId, sessionId, termId } = data;

  if (!studentId) {
    throw createHttpError(400, "student Id required");
  }

  if (!sessionId) {
    throw createHttpError(400, "session Id required");
  }

  if (!termId) {
    throw createHttpError(400, "Term Id required");
  }

  const enrollment = await prisma.enrollment.findFirst({
    where: {
      studentId,
      sessionId,
      session: {
        schoolId,
      },
    },
  });

  ensureExists(enrollment, "Enrollment");

  const existingReport = await prisma.reportCard.findUnique({
    where: {
      enrollmentId_termId: {
        enrollmentId: enrollment.id,
        termId,
      },
    },
  });

  if (existingReport) {
    throw createHttpError(400, "Report card has already been generated.");
  }

  const result = await getStudentResults(studentId, sessionId, termId, user);

  const reportCard = await prisma.reportCard.create({
    data: {
      enrollmentId: enrollment.id,
      termId,
      average: result.average,
      position: result.classPosition,
      overallGrade: result.overallGrade.grade,
      overallRemark: result.overallGrade.remark,
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
        },
      },

      term: true,
    },
  });

  return reportCard;
};

export const getReportCard = async (studentId, sessionId, termId, user) => {
  const { schoolId } = user;

  if (!studentId) {
    throw createHttpError(400, "Student ID is required.");
  }

  if (!sessionId) {
    throw createHttpError(400, "Session ID is required.");
  }

  if (!termId) {
    throw createHttpError(400, "Term ID is required.");
  }

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

  const reportCard = await prisma.reportCard.findUnique({
    where: {
      enrollmentId_termId: {
        enrollmentId: enrollment.id,
        termId,
      },
    },
    include: {
      term: true,
    },
  });

  ensureExists(reportCard, "Report card");

  const result = await getStudentResults(studentId, sessionId, termId, user);

  return {
    id: reportCard.id,

    student: enrollment.student,

    class: enrollment.class,

    session: enrollment.session,

    term: reportCard.term,

    average: reportCard.average,

    position: reportCard.position,

    teacherRemark: reportCard.teacherRemark,

    principalRemark: reportCard.principalRemark,

    published: reportCard.published,

    publishedAt: reportCard.publishedAt,

    subjects: result.subjects,

    totalSubjects: result.totalSubjects,

    totalObtained: result.totalObtained,

    totalPossible: result.totalPossible,

    classStatistics: result.classStatistics,
  };
};

export const updateTeacherRemark = async (reportCardId, data, user) => {
  const { remark } = data;

  if (!remark || !remark.trim()) {
    throw createHttpError(400, "Teacher remark is required.");
  }

  const reportCard = await prisma.reportCard.findUnique({
    where: {
      id: reportCardId,
    },
    include: {
      enrollment: {
        include: {
          class: true,
        },
      },
    },
  });

  ensureExists(reportCard, "Report card");

  if (reportCard.published) {
    throw createHttpError(400, "Published report cards cannot be modified.");
  }

  const teacher = await prisma.user.findUnique({
    where: {
      id: user.id,
    },
  });

  ensureExists(teacher, "Teacher");

  if (!["ADMIN", "TEACHER"].includes(teacher.role)) {
    throw createHttpError(
      403,
      "Only admins and teachers can add teacher remarks.",
    );
  }

  const updatedReportCard = await prisma.reportCard.update({
    where: {
      id: reportCardId,
    },
    data: {
      teacherRemark: remark.trim(),
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
        },
      },
      term: true,
    },
  });

  return updatedReportCard;
};

export const updatePrincipalRemark = async (reportCardId, data, user) => {
  const { remark } = data;

  if (!remark || !remark.trim()) {
    throw createHttpError(400, "Principal remark is required.");
  }

  const reportCard = await prisma.reportCard.findUnique({
    where: {
      id: reportCardId,
    },
  });

  ensureExists(reportCard, "Report card");

  if (reportCard.published) {
    throw createHttpError(400, "Published report cards cannot be modified.");
  }

  const updatedReportCard = await prisma.reportCard.update({
    where: {
      id: reportCardId,
    },
    data: {
      principalRemark: remark.trim(),
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
        },
      },
      term: true,
    },
  });

  return updatedReportCard;
};

// export const publishReportCard = async (reportCardId, user) => {
//   const reportCard = await prisma.reportCard.findUnique({
//     where: {
//       id: reportCardId,
//     },
//   });

//   ensureExists(reportCard, "Report card");

//   if (reportCard.published) {
//     throw createHttpError(400, "Report card has already been published.");
//   }

//   if (!reportCard.teacherRemark) {
//     throw createHttpError(400, "Teacher remark is required before publishing.");
//   }

//   if (!reportCard.principalRemark) {
//     throw createHttpError(
//       400,
//       "Principal remark is required before publishing.",
//     );
//   }

//   const publishedReportCard = await prisma.reportCard.update({
//     where: {
//       id: reportCardId,
//     },
//     data: {
//       published: true,
//       publishedAt: new Date(),
//     },
//     include: {
//       enrollment: {
//         include: {
//           student: {
//             select: {
//               id: true,
//               name: true,
//               email: true,
//             },
//           },
//           class: true,
//         },
//       },
//       term: true,
//     },
//   });

//   return publishedReportCard;
// };

export const getStudentReportCard = async (
  studentId,
  sessionId,
  termId,
  user,
) => {
  const { schoolId, id: userId } = user;

  if (!studentId) {
    throw createHttpError(400, "Student ID is required.");
  }

  if (!sessionId) {
    throw createHttpError(400, "Session ID is required.");
  }

  if (!termId) {
    throw createHttpError(400, "Term ID is required.");
  }

  // Student can only view their own report card
  if (studentId !== userId) {
    throw createHttpError(403, "You can only view your own report card.");
  }

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

  const reportCard = await prisma.reportCard.findUnique({
    where: {
      enrollmentId_termId: {
        enrollmentId: enrollment.id,
        termId,
      },
    },
    include: {
      term: true,
    },
  });

  ensureExists(reportCard, "Report card");

  if (!reportCard.published) {
    throw createHttpError(403, "This report card has not been published yet.");
  }

  const result = await getStudentResults(studentId, sessionId, termId, user);

  return {
    id: reportCard.id,

    student: enrollment.student,

    class: enrollment.class,

    session: enrollment.session,

    term: reportCard.term,

    average: reportCard.average,

    position: reportCard.position,

    teacherRemark: reportCard.teacherRemark,

    principalRemark: reportCard.principalRemark,

    published: reportCard.published,

    publishedAt: reportCard.publishedAt,

    subjects: result.subjects,

    totalSubjects: result.totalSubjects,

    totalObtained: result.totalObtained,

    totalPossible: result.totalPossible,
  };
};

export const getClassReportCards = async (classId, sessionId, termId, user) => {
  const { schoolId } = user;

  if (!classId) {
    throw createHttpError(400, "Class ID is required.");
  }

  if (!sessionId) {
    throw createHttpError(400, "Session ID is required.");
  }

  if (!termId) {
    throw createHttpError(400, "Term ID is required.");
  }

  // 1. Verify class belongs to this school
  const schoolClass = await prisma.class.findFirst({
    where: {
      id: classId,
      schoolId,
    },
  });

  ensureExists(schoolClass, "Class");

  // 2. Verify session belongs to this school
  const session = await prisma.academicSession.findFirst({
    where: {
      id: sessionId,
      schoolId,
    },
  });

  ensureExists(session, "Academic session");

  // 3. Verify term belongs to this session
  const term = await prisma.term.findFirst({
    where: {
      id: termId,
      sessionId,
    },
  });

  ensureExists(term, "Term");

  // 4. Get all report cards for this class
  const reportCards = await prisma.reportCard.findMany({
    where: {
      termId,

      enrollment: {
        classId,
        sessionId,
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
        },
      },

      term: true,
    },

    orderBy: {
      position: "asc",
    },
  });

  // 5. Build detailed result for every student
  const detailedReportCards = await Promise.all(
    reportCards.map(async (reportCard) => {
      const studentId = reportCard.enrollment.studentId;

      const result = await getStudentResults(
        studentId,
        sessionId,
        termId,
        user,
      );

      const attendanceRecords = await prisma.attendance.findMany({
        where: {
          enrollmentId: reportCard.enrollmentId,

          date: {
            gte: term.startDate,
            lte: term.endDate,
          },
        },
      });

      const attendance = getAttendanceSummary(attendanceRecords);

      return {
        id: reportCard.id,

        student: reportCard.enrollment.student,

        class: reportCard.enrollment.class,

        session,

        term,

        average: reportCard.average,

        position: reportCard.position,

        teacherRemark: reportCard.teacherRemark,

        principalRemark: reportCard.principalRemark,

        published: reportCard.published,

        publishedAt: reportCard.publishedAt,

        totalSubjects: result.totalSubjects,

        totalObtained: result.totalObtained,

        totalPossible: result.totalPossible,

        overallGrade: result.overallGrade,

        subjects: result.subjects,

        attendance,
      };
    }),
  );

  return {
    class: schoolClass,
    session,
    term,

    totalStudents: detailedReportCards.length,

    reportCards: detailedReportCards,
  };
};

export const publishReportCard = async (reportCardId, user) => {
  const reportCard = await prisma.reportCard.findUnique({
    where: {
      id: reportCardId,
    },
  });

  ensureExists(reportCard, "Report card");

  if (reportCard.published) {
    throw createHttpError(400, "Report card has already been published.");
  }

  if (!reportCard.teacherRemark) {
    throw createHttpError(400, "Teacher remark is required before publishing.");
  }

  if (!reportCard.principalRemark) {
    throw createHttpError(
      400,
      "Principal remark is required before publishing.",
    );
  }

  const publishedReportCard = await prisma.reportCard.update({
    where: {
      id: reportCardId,
    },
    data: {
      published: true,
      publishedAt: new Date(),
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
        },
      },
      term: true,
    },
  });

  return publishedReportCard;
};
