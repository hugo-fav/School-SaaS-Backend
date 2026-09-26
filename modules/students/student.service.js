import prisma from "../../config/prisma.js";
import bcrypt from "bcrypt";
import { ensureExists } from "../../utils/validations/ensureExists.js";
import { getStudentResults } from "../result/result.service.js";
import createHttpError from "../../utils/errors/createHttpError.js";

const studentSafeSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  schoolId: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
};

export const createStudent = async (studentData, schoolId) => {
  const { name, email, password, classId } = studentData; // Extract classId

  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    throw createHttpError(409, "An account with this email already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  return prisma.$transaction(async (tx) => {
    // 1. Create the base user
    const student = await tx.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "STUDENT",
        schoolId,
      },
      select: studentSafeSelect,
    });

    let assignedClass = null;

    // 2. If a class was selected on the frontend, handle enrollment
    if (classId) {
      const activeSession = await tx.academicSession.findFirst({
        where: { schoolId, isActive: true },
      });

      // 🔴 PREVENT SILENT FAILURE: Tell the user exactly what is wrong
      if (!activeSession) {
        throw createHttpError(
          400,
          "Cannot assign class: You must set an Active Academic Session in the Sessions module first.",
        );
      }

      // Create the enrollment
      await tx.enrollment.create({
        data: {
          studentId: student.id,
          classId: classId,
          sessionId: activeSession.id,
          status: "ACTIVE",
        },
      });

      // Fetch the class details so we can send it back to the frontend immediately
      assignedClass = await tx.class.findUnique({
        where: { id: classId },
        select: { id: true, name: true },
      });
    }

    // 3. Return the payload EXACTLY how the frontend table expects it
    return {
      ...student,
      class: assignedClass,
      enrollment: assignedClass?.name || "Unassigned",
    };
  });
};

// Admin sees every student in the school, now including their active class.
export const getStudents = async (schoolId) => {
  const students = await prisma.user.findMany({
    where: { role: "STUDENT", schoolId },
    select: {
      ...studentSafeSelect,
      enrollments: {
        where: { status: "ACTIVE" },
        include: {
          class: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Map the response so the frontend table gets the nested class names cleanly
  return students.map((student) => ({
    ...student,
    class: student.enrollments[0]?.class || null,
    enrollment: student.enrollments[0]?.class?.name || "Unassigned",
  }));
};

// Teacher sees only students enrolled in classes they're assigned to teach.
export const getStudentsForTeacher = async (teacherId, schoolId) => {
  const teacherSubjects = await prisma.teacherSubject.findMany({
    where: { teacherId, session: { schoolId } },
    select: { classId: true, sessionId: true },
  });

  if (teacherSubjects.length === 0) return [];

  const enrollments = await prisma.enrollment.findMany({
    where: {
      status: "ACTIVE",
      OR: teacherSubjects.map(({ classId, sessionId }) => ({
        classId,
        sessionId,
      })),
    },
    include: { student: { select: studentSafeSelect } },
  });

  const seen = new Map();
  for (const enrollment of enrollments) {
    seen.set(enrollment.student.id, enrollment.student);
  }
  return Array.from(seen.values());
};

export const getStudent = async (studentId, schoolId) => {
  return prisma.user.findFirst({
    where: { id: studentId, role: "STUDENT", schoolId },
    select: studentSafeSelect,
  });
};

// Teacher can only view a student if that student is enrolled in one of
// the teacher's own class/subject assignments.
export const getStudentForTeacher = async (studentId, teacherId, schoolId) => {
  const teacherSubjects = await prisma.teacherSubject.findMany({
    where: { teacherId, session: { schoolId } },
    select: { classId: true, sessionId: true },
  });

  if (teacherSubjects.length === 0) return null;

  const enrollment = await prisma.enrollment.findFirst({
    where: {
      studentId,
      status: "ACTIVE",
      OR: teacherSubjects.map(({ classId, sessionId }) => ({
        classId,
        sessionId,
      })),
    },
    include: { student: { select: studentSafeSelect } },
  });

  return enrollment ? enrollment.student : null;
};

export const updateStudent = async (studentId, schoolId, updateData) => {
  const { name, email } = updateData;

  if (email) {
    const existingUser = await prisma.user.findFirst({
      where: { email, NOT: { id: studentId } },
    });

    if (existingUser) {
      throw createHttpError(409, "An account with this email already exists");
    }
  }

  return prisma.user.updateMany({
    where: { id: studentId, role: "STUDENT", schoolId },
    data: { name, email },
  });
};

// Soft delete — deactivates the account rather than removing it, since a
// student has financial (Invoice/Payment) and academic history attached
// that must be preserved.
export const deactivateStudent = async (studentId, schoolId) => {
  const student = await prisma.user.findFirst({
    where: { id: studentId, role: "STUDENT", schoolId },
  });

  if (!student) {
    throw createHttpError(404, "Student not found or not in your school");
  }

  return prisma.user.update({
    where: { id: studentId },
    data: { isActive: false },
    select: studentSafeSelect,
  });
};

// ---- existing "me" functions below are unchanged ----

export const getMyProfile = async (user) => {
  const { id: userId, schoolId, role } = user;

  if (role !== "STUDENT") {
    throw createHttpError(
      403,
      "Only students can access their student profile.",
    );
  }

  const student = await prisma.user.findFirst({
    where: { id: userId, schoolId, role: "STUDENT" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      school: { select: { id: true, name: true } },
      enrollments: {
        select: {
          id: true,
          createdAt: true,
          updatedAt: true,
          class: {
            select: { id: true, name: true, createdAt: true, updatedAt: true },
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
        orderBy: { createdAt: "desc" },
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
    where: { studentId, session: { schoolId } },
    include: {
      class: {
        include: {
          teacherSubjects: {
            include: {
              subject: {
                select: { id: true, name: true, code: true, description: true },
              },
              teacher: { select: { id: true, name: true, email: true } },
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
    orderBy: { createdAt: "desc" },
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
  if (!sessionId) throw createHttpError(400, "Session ID is required.");
  if (!termId) throw createHttpError(400, "Term ID is required.");

  return getStudentResults(studentId, sessionId, termId, user);
};

export const getMyAttendance = async (sessionId, termId, user) => {
  const { id: studentId, schoolId, role } = user;

  if (role !== "STUDENT") {
    throw createHttpError(403, "Only students can access their attendance.");
  }
  if (!sessionId) throw createHttpError(400, "Session ID is required.");
  if (!termId) throw createHttpError(400, "Term ID is required.");

  const enrollment = await prisma.enrollment.findFirst({
    where: { studentId, sessionId, session: { schoolId } },
    include: {
      student: { select: { id: true, name: true, email: true } },
      class: true,
      session: true,
    },
  });

  ensureExists(enrollment, "Enrollment");

  const term = await prisma.term.findFirst({
    where: { id: termId, sessionId },
  });

  ensureExists(term, "Term");

  const attendanceRecords = await prisma.attendance.findMany({
    where: {
      enrollmentId: enrollment.id,
      date: { gte: term.startDate, lte: term.endDate },
      teacherSubject: { sessionId },
    },
    include: {
      teacherSubject: {
        include: {
          subject: { select: { id: true, name: true, code: true } },
          teacher: { select: { id: true, name: true, email: true } },
        },
      },
    },
    orderBy: { date: "asc" },
  });

  const totalDays = attendanceRecords.length;
  const presentDays = attendanceRecords.filter(
    (r) => r.status === "PRESENT",
  ).length;
  const absentDays = attendanceRecords.filter(
    (r) => r.status === "ABSENT",
  ).length;
  const lateDays = attendanceRecords.filter((r) => r.status === "LATE").length;
  const excusedDays = attendanceRecords.filter(
    (r) => r.status === "EXCUSED",
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
