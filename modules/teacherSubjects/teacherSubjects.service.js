import prisma from "../../config/prisma.js";
import createHttpError from "../../utils/errors/createHttpError.js";

export const createTeacherSubject = async (data, schoolId) => {
  return prisma.$transaction(async (tx) => {
    const { teacherId, subjectId, classId, sessionId } = data;

    // validate Teacher
    const teacher = await tx.user.findFirst({
      where: { id: teacherId, schoolId, role: "TEACHER" },
    });

    if (!teacher) {
      const errror = new Error("Teacher not found or not in your school");
      errror.statusCode = 404;
      throw errror;
    }

    // validate Subject
    const subject = await tx.subject.findFirst({
      where: { id: subjectId, schoolId },
    });

    if (!subject) {
      const error = new Error("Subject not found or not in your school");
      error.statusCode = 404;
      throw error;
    }

    // validate Class
    const classRoom = await tx.class.findFirst({
      where: { id: classId, schoolId },
    });

    if (!classRoom) {
      const error = new Error("Class not found or not in your school");
      error.statusCode = 404;
      throw error;
    }

    // validate Session
    const session = await tx.academicSession.findFirst({
      where: { id: sessionId, schoolId },
    });

    if (!session) {
      const error = new Error("Session not found or not in your school");
      error.statusCode = 404;
      throw error;
    }

    // only active session can be used to assign teacher subjects
    if (!session.isActive) {
      const error = new Error(
        "Teacher can only be assigned during the active academic session",
      );
      error.statusCode = 400;
      throw error;
    }

    // prevent duplicate assignment
    const existingAssignment = await tx.teacherSubject.findFirst({
      where: {
        teacherId,
        subjectId,
        classId,
        sessionId,
      },
    });

    if (existingAssignment) {
      const error = new Error(
        "Teacher is already assigned to this subject for the specified class and session",
      );
      error.statusCode = 400;
      throw error;
    }

    // Create assignment
    return tx.teacherSubject.create({
      data: {
        teacherId,
        subjectId,
        classId,
        sessionId,
      },
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
    });
  });
};

export const getTeacherSubjects = async (schoolId) => {
  return prisma.teacherSubject.findMany({
    where: {
      session: {
        schoolId,
      },
    },
    include: {
      teacher: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      subject: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
      class: {
        select: {
          id: true,
          name: true,
        },
      },
      session: {
        select: {
          id: true,
          name: true,
          isActive: true,
        },
      },
    },
    orderBy: [{ teacher: { name: "asc" } }, { subject: { name: "asc" } }],
  });
};

export const getTeacherSubject = async (id, schoolId) => {
  return prisma.teacherSubject.findFirst({
    where: { id, session: { schoolId } },
    include: {
      teacher: true,
      subject: true,
      class: true,
      session: true,
    },
  });
};

export const updateTeacherSubject = async (id, schoolId, data) => {
  return prisma.$transaction(async (tx) => {
    // check assignment exists and belongs to the school
    const assignment = await tx.teacherSubject.findFirst({
      where: { id, session: { schoolId } },
    });

    if (!assignment) {
      const error = new Error("Teacher subject not found");
      error.statusCode = 404;
      throw error;
    }

    const teacherId = data.teacherId ?? assignment.teacherId;
    const subjectId = data.subjectId ?? assignment.subjectId;
    const classId = data.classId ?? assignment.classId;
    const sessionId = data.sessionId ?? assignment.sessionId;

    //  validate Teacher
    const teacher = await tx.user.findFirst({
      where: { id: teacherId, schoolId, role: "TEACHER" },
    });

    if (!teacher) {
      const error = new Error("Teacher not found or not in your school");
      error.statusCode = 404;
      throw error;
    }

    // validate Subject
    const subject = await tx.subject.findFirst({
      where: { id: subjectId, schoolId },
    });

    if (!subject) {
      const error = new Error("Subject not found or not in your school");
      error.statusCode = 404;
      throw error;
    }

    // validate Class
    const classRoom = await tx.class.findFirst({
      where: { id: classId, schoolId },
    });

    if (!classRoom) {
      const error = new Error("Class not found or not in your school");
      error.statusCode = 404;
      throw error;
    }

    // validate Session
    const session = await tx.academicSession.findFirst({
      where: { id: sessionId, schoolId },
    });

    if (!session) {
      const error = new Error("Session not found or not in your school");
      error.statusCode = 404;
      throw error;
    }

    if (!session.isActive) {
      const error = new Error(
        "Teacher can only be reassigned during the active academic session",
      );
      error.statusCode = 400;
      throw error;
    }

    // Prevent duplicate assignment
    const duplicate = await tx.teacherSubject.findFirst({
      where: {
        teacherId,
        subjectId,
        classId,
        sessionId,
        NOT: { id },
      },
    });

    if (duplicate) {
      const error = new Error(
        "Teacher is already assigned to this subject for the specified class and session",
      );
      error.statusCode = 400;
      throw error;
    }

    return tx.teacherSubject.update({
      where: { id },
      data: {
        teacherId,
        subjectId,
        classId,
        sessionId,
      },
      include: {
        teacher: true,
        subject: true,
        class: true,
        session: true,
      },
    });
  });
};

export const deleteTeacherSubject = async (id, schoolId) => {
  const assignment = await prisma.teacherSubject.findFirst({
    where: { id, session: { schoolId } },
    include: {
      assessments: true,
      attendance: true,
    },
  });

  if (!assignment) {
    const error = new Error("Teacher assignment not found");
    error.statusCode = 404;
    throw error;
  }

  if (assignment.assessments.length) {
    const error = new Error(
      "Cannot delete teacher assignment because assessment already exists",
    );
    error.statusCode = 400;
    throw error;
  }

  if (assignment.attendance.length > 0) {
    const error = new Error(
      "Cannot delete assignment because attendance records already exist",
    );
    error.statusCode = 400;
    throw error;
  }

  return prisma.teacherSubject.delete({
    where: { id },
  });
};
