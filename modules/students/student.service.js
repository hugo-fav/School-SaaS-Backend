import prisma from "../../config/prisma.js";
import bcrypt from "bcrypt";
import { ensureExists } from "../../utils/validations/ensureExists.js";
import { getStudentResults } from "../result/result.service.js";
import createHttpError from "../../utils/errors/createHttpError.js";

export const createStudent = async (studentData, schoolId) => {
  const { name, email, password } = studentData;

  const hashedPassword = await bcrypt.hash(password, 10);

  return prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: "STUDENT",
      schoolId,
    },
  });
};

export const getStudents = async (schoolId) => {
  return prisma.user.findMany({
    where: {
      role: "STUDENT",
      schoolId,
    },
  });
};

export const getStudent = async (studentId, schoolId) => {
  return prisma.user.findFirst({
    where: {
      id: studentId,
      role: "STUDENT",
      schoolId,
    },
  });
};

export const updateStudent = async (studentId, schoolId, updateData) => {
  const { name, email } = updateData;

  return prisma.user.updateMany({
    where: {
      id: studentId,
      role: "STUDENT",
      schoolId,
    },
    data: {
      name,
      email,
    },
  });
};

export const deleteStudent = async (studentId, schoolId) => {
  return prisma.user.deleteMany({
    where: {
      id: studentId,
      role: "STUDENT",
      schoolId,
    },
  });
};

export const getMyProfile = async (user) => {
  const { id: userId, schoolId, role } = user;

  if (role !== "STUDENT") {
    throw createHttpError(
      403,
      "Only students can access their student profile.",
    );
  }

  const student = await prisma.user.findFirst({
    where: {
      id: userId,
      schoolId,
      role: "STUDENT",
    },

    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,

      school: {
        select: {
          id: true,
          name: true,
        },
      },

      enrollments: {
        select: {
          id: true,
          createdAt: true,
          updatedAt: true,

          class: {
            select: {
              id: true,
              name: true,
              createdAt: true,
              updatedAt: true,
            },
          },

          session: {
            select: {
              id: true,
              name: true,
              isActive: true,
              startDate: true,
              endDate: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  ensureExists(student, "Student");

  return student;
};

export const getMyClasses = async (user) => {
  const { id: studentId, schoolId, role } = user;

  if (role !== "STUDENT") {
    throw createHttpError(403, "Only students can access their classes.");
  }

  const enrollments = await prisma.enrollment.findMany({
    where: {
      studentId,
      session: {
        schoolId,
      },
    },

    include: {
      class: {
        include: {
          teacherSubjects: {
            include: {
              subject: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                  description: true,
                },
              },

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

      session: {
        select: {
          id: true,
          name: true,
          isActive: true,
          startDate: true,
          endDate: true,
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },
  });

  return enrollments.map((enrollment) => ({
    enrollmentId: enrollment.id,

    class: {
      id: enrollment.class.id,
      name: enrollment.class.name,
      createdAt: enrollment.class.createdAt,
      updatedAt: enrollment.class.updatedAt,
    },

    session: enrollment.session,

    subjects: enrollment.class.teacherSubjects.map((teacherSubject) => ({
      id: teacherSubject.subject.id,
      name: teacherSubject.subject.name,
      code: teacherSubject.subject.code,
      description: teacherSubject.subject.description,

      teacher: {
        id: teacherSubject.teacher.id,
        name: teacherSubject.teacher.name,
        email: teacherSubject.teacher.email,
      },
    })),
  }));
};

export const getMyResults = async (sessionId, termId, user) => {
  const { id: studentId, role } = user;

  if (role !== "STUDENT") {
    throw createHttpError(403, "Only students can access their results.");
  }

  if (!sessionId) {
    throw createHttpError(400, "Session ID is required.");
  }

  if (!termId) {
    throw createHttpError(400, "Term ID is required.");
  }

  const results = await getStudentResults(studentId, sessionId, termId, user);

  return results;
};

export const getMyAttendance = async (sessionId, termId, user) => {
  const { id: studentId, schoolId, role } = user;

  if (role !== "STUDENT") {
    throw createHttpError(403, "Only students can access their attendance.");
  }

  if (!sessionId) {
    throw createHttpError(400, "Session ID is required.");
  }

  if (!termId) {
    throw createHttpError(400, "Term ID is required.");
  }

  // Make sure the student belongs to this school/session
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

  // Make sure the term belongs to the requested session
  const term = await prisma.term.findFirst({
    where: {
      id: termId,
      sessionId,
    },
  });

  ensureExists(term, "Term");

  // Get attendance belonging ONLY to this student's enrollment
  const attendanceRecords = await prisma.attendance.findMany({
    where: {
      enrollmentId: enrollment.id,
      date: {
        gte: term.startDate,
        lte: term.endDate,
      },
      teacherSubject: {
        sessionId,
      },
    },
    include: {
      teacherSubject: {
        include: {
          subject: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
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
    orderBy: {
      date: "asc",
    },
  });

  const totalDays = attendanceRecords.length;

  const presentDays = attendanceRecords.filter(
    (record) => record.status === "PRESENT",
  ).length;

  const absentDays = attendanceRecords.filter(
    (record) => record.status === "ABSENT",
  ).length;

  const lateDays = attendanceRecords.filter(
    (record) => record.status === "LATE",
  ).length;

  const excusedDays = attendanceRecords.filter(
    (record) => record.status === "EXCUSED",
  ).length;

  const percentage =
    totalDays === 0 ? 0 : Number(((presentDays / totalDays) * 100).toFixed(2));

  return {
    student: enrollment.student,
    class: enrollment.class,
    session: enrollment.session,
    term,

    summary: {
      totalDays,
      presentDays,
      absentDays,
      lateDays,
      excusedDays,
      percentage,
    },

    records: attendanceRecords,
  };
};
