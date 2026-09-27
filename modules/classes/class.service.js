import prisma from "../../config/prisma.js";
import createHttpError from "../../utils/errors/createHttpError.js";
import { createEnrollment } from "../enrollments/enrollments.service.js";

export const createClass = async (classData, schoolId) => {
  const { name } = classData;
  return prisma.class.create({ data: { name, schoolId } });
};

// 🔴 FIX 1: Tell Prisma to count active enrollments and subjects for the list
export const getClasses = async (schoolId) => {
  const classes = await prisma.class.findMany({
    where: { schoolId },
    include: {
      _count: {
        select: {
          // Count only active students (optional: remove the where block to count all historical)
          enrollments: { where: { status: "ACTIVE" } },
          teacherSubjects: true,
        },
      },
    },
  });

  // Map it to exactly match the variable names your frontend is expecting!
  return classes.map((cls) => ({
    ...cls,
    enrollmentsCount: cls._count.enrollments,
    assignmentsCount: cls._count.teacherSubjects,
  }));
};

export const getClass = async (classId, schoolId) => {
  return prisma.class.findFirst({ where: { id: classId, schoolId } });
};

// 🔴 FIX 2: Change updateMany to update so it returns the actual updated object!
export const updateClass = async (classId, schoolId, updateData) => {
  const { name } = updateData;

  const existingClass = await prisma.class.findFirst({
    where: { id: classId, schoolId },
  });

  if (!existingClass) {
    throw createHttpError(404, "Class not found");
  }

  const updatedClass = await prisma.class.update({
    where: { id: classId },
    data: { name },
    include: {
      _count: {
        select: {
          enrollments: { where: { status: "ACTIVE" } },
          teacherSubjects: true,
        },
      },
    },
  });

  return {
    ...updatedClass,
    enrollmentsCount: updatedClass._count.enrollments,
    assignmentsCount: updatedClass._count.teacherSubjects,
  };
};

// Blocks deletion if the class still has enrollments or teacher/subject
// assignments — deleting it out from under active students/teachers would
// orphan Enrollment, TeacherSubject, Score, Attendance, and Fee records.
export const deleteClass = async (classId, schoolId) => {
  const classData = await prisma.class.findFirst({
    where: { id: classId, schoolId },
  });

  if (!classData) {
    throw createHttpError(404, "Class not found or not in your school");
  }

  const [enrollmentCount, teacherSubjectCount] = await Promise.all([
    prisma.enrollment.count({ where: { classId } }),
    prisma.teacherSubject.count({ where: { classId } }),
  ]);

  if (enrollmentCount > 0 || teacherSubjectCount > 0) {
    throw createHttpError(
      409,
      "This class cannot be deleted because it still has enrolled students or assigned teacher/subjects.",
    );
  }

  return prisma.class.delete({ where: { id: classId } });
};

// Enrolls a student into a class for a given session — delegates entirely
// to the Enrollments module's own createEnrollment, so there is exactly
// one place that owns enrollment-creation rules (active-session check,
// duplicate-enrollment check, etc.). classId comes from the URL param,
// so it's injected into the payload here rather than trusted from the body.
export const enrollStudentInClass = async (
  classId,
  studentId,
  sessionId,
  user,
) => {
  return createEnrollment({ studentId, classId, sessionId }, user);
};

// Returns a class with its enrolled students (optionally filtered to one
// session) and its teacher/subject assignments.
export const getClassWithMembers = async (
  classId,
  schoolId,
  sessionId,
  includeInactive = false,
) => {
  return prisma.class.findFirst({
    where: { id: classId, schoolId },
    include: {
      enrollments: {
        where: {
          ...(sessionId ? { sessionId } : {}),
          ...(includeInactive ? {} : { status: "ACTIVE" }),
        },
        include: {
          student: { select: { id: true, name: true, email: true } },
          session: { select: { id: true, name: true, isActive: true } },
        },
      },
      teacherSubjects: {
        where: sessionId ? { sessionId } : undefined,
        include: {
          teacher: { select: { id: true, name: true, email: true } },
          subject: { select: { id: true, name: true, code: true } },
        },
      },
    },
  });
};
