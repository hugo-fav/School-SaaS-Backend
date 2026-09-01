import prisma from "../../config/prisma.js";
import createHttpError from "../../utils/errors/createHttpError.js";
import { checkTeacherOwnership } from "../../utils/validations/checkTeacherOwnership.js";
import { ensureExists } from "../../utils/validations/ensureExists.js";
import { ensureNoDuplicateAttendance } from "../../utils/validations/ensureNoDuplicateAttendance.js";
import { validateAttendanceDate } from "../../utils/validations/validateAttendanceDate.js";

export const createBulkAttendance = async (data, user) => {
  return prisma.$transaction(async (tx) => {
    const { id: userId, schoolId, role } = user;

    const { teacherSubjectId, date, attendance } = data;

    //  Validation
    if (!teacherSubjectId) {
      throw createHttpError(400, "Teacher subject is requires");
    }

    if (!Array.isArray(attendance) || attendance.length === 0) {
      throw createHttpError(400, "At least one attendance must be provided");
    }

    const attendanceDate = validateAttendanceDate(date);

    ensureNoDuplicateAttendance(attendance);

    const teacherSubject = await tx.teacherSubject.findFirst({
      where: {
        id: teacherSubjectId,
        session: {
          schoolId,
        },
      },
      include: {
        teacher: true,
        class: true,
        subject: true,
        session: true,
      },
    });

    ensureExists(teacherSubject, "Teacher subject");

    checkTeacherOwnership(role, userId, teacherSubject.teacherId);

    if (!teacherSubject.session.isActive) {
      throw createHttpError(
        400,
        "Attendance can only be recorded for the active academic session",
      );
    }

    const enrollmentIds = attendance.map((item) => item.enrollmentId);

    const enrollments = await tx.enrollment.findMany({
      where: {
        id: {
          in: enrollmentIds,
        },
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

    if (enrollments.length !== enrollmentIds.length) {
      const foundIds = enrollments.map((enrollment) => enrollment.id);

      const missingIds = enrollmentIds.filter((id) => !foundIds.includes(id));

      throw createHttpError(
        404,
        `The following enrollment IDs were not found: ${missingIds.join(", ")}`,
      );
    }

    for (const enrollment of enrollments) {
      if (enrollment.classId !== teacherSubject.classId) {
        throw createHttpError(
          400,
          `${enrollment.student.name} does not belong to this class`,
        );
      }
    }

    for (const enrollment of enrollments) {
      if (enrollment.sessionId !== teacherSubject.sessionId) {
        throw createHttpError(
          400,
          `${enrollment.student.name} belongs to a different academic session`,
        );
      }
    }

    const existingAttendance = await tx.attendance.findMany({
      where: {
        teacherSubjectId,
        date: attendanceDate,
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

    if (existingAttendance.length > 0) {
      const studentNames = existingAttendance.map(
        (record) => record.enrollment.student.name,
      );
      throw createHttpError(
        400,
        `Attendance already recorded for the following students on ${attendanceDate.toISOString().split("T")[0]}: ${studentNames.join(", ")}`,
      );
    }

    const createdAttendance = await Promise.all(
      attendance.map((item) =>
        tx.attendance.create({
          data: {
            enrollmentId: item.enrollmentId,
            teacherSubjectId,
            date: attendanceDate,
            status: item.status,
            markedById: userId,
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

            markedBy: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        }),
      ),
    );

    return createdAttendance;
  });
};

export const getAttendance = async (filters, user) => {
  const { schoolId } = user;

  const {
    teacherSubjectId,
    studentId,
    classId,
    teacherId,
    sessionId,
    date,
    status,
    // page = 1,
    // limit = 10,
  } = filters;

  const where = {
    teacherSubject: {
      session: {
        schoolId,
      },
    },
  };

  if (teacherSubjectId) {
    where.teacherSubjectId = teacherSubjectId;
  }

  if (studentId) {
    where.enrollment = {
      studentId,
    };
  }

  if (classId) {
    where.teacherSubject.classId = classId;
  }

  if (teacherId) {
    where.teacherSubject.teacherId = teacherId;
  }

  if (sessionId) {
    where.teacherSubject.sessionId = sessionId;
  }

  if (date) {
    where.date = new Date(date);
  }

  if (status) {
    where.status = status;
  }

  const attendance = await prisma.attendance.findMany({
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

      markedBy: {
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

  return attendance;
};

export const getAttendanceById = async (id, schoolId) => {
  const attendance = await prisma.attendance.findFirst({
    where: {
      id,
      teacherSubject: {
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
      markedBy: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });

  ensureExists(attendance, "Attendance");

  return attendance;
};

export const updateAttendance = async (id, user, data) => {
  return prisma.$transaction(async (tx) => {
    const { id: userId, schoolId, role } = user;

    const { status, date } = data;

    const attendance = await tx.attendance.findFirst({
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
            session: true,
          },
        },
      },
    });

    ensureExists(attendance, "Attendance");

    checkTeacherOwnership(role, userId, attendance.teacherSubject.teacherId);

    if (!attendance.teacherSubject.session.isActive) {
      throw createHttpError(
        400,
        "Attendance can only be updated for the active academic session",
      );
    }

    const updateData = {
      date: attendance.date,
    };

    if (status) {
      updateData.status = status;
    }

    if (date) {
      updateData.date = new Date(date);
    }

    const duplicate = await tx.attendance.findFirst({
      where: {
        teacherSubjectId: attendance.teacherSubjectId,
        enrollmentId: attendance.enrollmentId,
        date: updateData.date,
        NOT: { id },
      },
    });

    if (duplicate) {
      throw createHttpError(
        400,
        `Attendance already recorded for this student on ${updateData.date.toISOString().split("T")[0]}`,
      );
    }

    const updatedAttendance = await tx.attendance.update({
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

        markedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return updatedAttendance;
  });
};

export const deleteAttendance = async (id, user) => {
  const { id: userId, schoolId, role } = user;

  return prisma.$transaction(async (tx) => {
    const attendance = await tx.attendance.findFirst({
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
            session: true,
          },
        },
      },
    });

    ensureExists(attendance, "Attendance");

    checkTeacherOwnership(role, userId, attendance.teacherSubject.teacherId);

    if (!attendance.teacherSubject.session.isActive) {
      throw createHttpError(
        400,
        "Attendance can only be deleted for the active academic session",
      );
    }

    const deletedAttendance = await tx.attendance.delete({
      where: { id },
    });

    return deletedAttendance;
  });
};
