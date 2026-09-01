import prisma from "../../config/prisma.js";
import bcrypt from "bcrypt";

export const createTeacher = async (teacherData, schoolId) => {
  const { name, email, password } = teacherData;

  const hashedPassword = await bcrypt.hash(password, 10);

  return prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: "TEACHER",
      schoolId,
    },
  });
};

export const getTeachers = async (schoolId) => {
  return prisma.user.findMany({
    where: {
      role: "TEACHER",
      schoolId,
    },
  });
};

export const getTeacher = async (teacherId, schoolId) => {
  return prisma.user.findFirst({
    where: {
      id: teacherId,
      role: "TEACHER",
      schoolId,
    },
  });
};

export const updateTeacher = async (teacherId, schoolId, updateData) => {
  const { name, email } = updateData;

  return prisma.user.updateMany({
    where: {
      id: teacherId,
      role: "TEACHER",
      schoolId,
    },
    data: {
      name,
      email,
    },
  });
};

export const deleteTeacher = async (teacherId, schoolId) => {
  return prisma.user.deleteMany({
    where: {
      id: teacherId,
      role: "TEACHER",
      schoolId,
    },
  });
};

export const getMyProfile = async (teacherId, schoolId) => {
  return prisma.user.findFirst({
    where: {
      id: teacherId,
      schoolId,
      role: "TEACHER",
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });
};

export const getMyClasses = async (teacherId, schoolId) => {
  const teacherSubjects = await prisma.teacherSubject.findMany({
    where: {
      teacherId,
      session: {
        schoolId,
      },
    },
    include: {
      class: true,
      subject: true,
      session: true,
    },
    orderBy: {
      class: {
        name: "asc",
      },
    },
  });

  return teacherSubjects;
};

export const getMyStudents = async (teacherId, schoolId) => {
  const teacherSubjects = await prisma.teacherSubject.findMany({
    where: {
      teacherId,
      session: {
        schoolId,
      },
    },
    include: {
      subject: true,
      class: {
        include: {
          enrollments: {
            include: {
              student: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  createdAt: true,
                },
              },
            },
          },
        },
      },
      session: true,
    },
  });

  return teacherSubjects;
};

export const getMySubjects = async (teacherId, schoolId) => {
  return prisma.teacherSubject.findMany({
    where: {
      teacherId,
      class: {
        schoolId,
      },
    },
    include: {
      subject: {
        select: {
          id: true,
          name: true,
          code: true,
          description: true,
        },
      },
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
      subject: {
        name: "asc",
      },
    },
  });
};

export const getStudentsByTeacherSubject = async (
  teacherSubjectId,
  teacherId,
  schoolId,
) => {
  const teacherSubject = await prisma.teacherSubject.findFirst({
    where: {
      id: teacherSubjectId,
      teacherId,
      session: {
        schoolId,
      },
    },
    include: {
      subject: true,
      class: true,
      session: true,
    },
  });

  if (!teacherSubject) {
    const error = new Error(
      "Teacher subject not found or you are not assigned to it",
    );
    error.statusCode = 404;
    throw error;
  }

  const enrollments = await prisma.enrollment.findMany({
    where: {
      classId: teacherSubject.classId,
      sessionId: teacherSubject.sessionId,
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
          createdAt: true,
        },
      },
    },
    orderBy: {
      student: {
        name: "asc",
      },
    },
  });

  return {
    teacherSubject: {
      id: teacherSubject.id,
      subject: teacherSubject.subject,
      class: teacherSubject.class,
      session: teacherSubject.session,
    },

    students: enrollments.map((enrollment) => ({
      enrollmentId: enrollment.id,
      student: enrollment.student,
    })),
  };
};
