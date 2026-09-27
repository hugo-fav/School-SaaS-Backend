import prisma from "../../config/prisma.js";

export const createSubject = async (data, schoolId) => {
  const { name, code, description } = data;

  if (!name || !name.trim()) {
    const error = new Error("Subject name is required.");
    error.statusCode = 400;
    throw error;
  }

  // check for duplicate subject name or code within the same school
  const existingSubject = await prisma.subject.findFirst({
    where: {
      schoolId,
      name,
    },
  });

  if (existingSubject) {
    const error = new Error(
      "Subject with this name already exists in your school",
    );
    error.statusCode = 400;
    throw error;
  }

  return prisma.subject.create({
    data: { name, code, description, schoolId },
  });
};

// Update getSubjects to include assignments count for the table
export const getSubjects = async (schoolId) => {
  const subjects = await prisma.subject.findMany({
    where: { schoolId },
    include: {
      _count: {
        select: { teacherSubjects: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return subjects.map((sub) => ({
    ...sub,
    assignmentsCount: sub._count.teacherSubjects,
  }));
};

// Update getSubject (the ID page) to pull proper session details and assignments
export const getSubject = async (id, schoolId) => {
  const subject = await prisma.subject.findFirst({
    where: { id, schoolId },
    include: {
      teacherSubjects: {
        include: {
          teacher: {
            select: { id: true, name: true, email: true },
          },
          class: {
            select: { id: true, name: true },
          },
          session: {
            select: { id: true, name: true, isActive: true },
          },
        },
      },
    },
  });

  if (!subject) return null;

  return {
    ...subject,
    assignmentsCount: subject.teacherSubjects.length,
  };
};

export const updateSubject = async (id, schoolId, data) => {
  if (data.name && !data.name.trim()) {
    const error = new Error("Subject name cannot be empty.");
    error.statusCode = 400;
    throw error;
  }

  //  check if the subject exists and belongs to the school
  const subject = await prisma.subject.findFirst({
    where: { id, schoolId },
  });

  if (!subject) {
    const error = new Error(
      "Subject not found or does not belong to your school",
    );
    error.statusCode = 404;
    throw error;
  }

  // check for duplicate subject name or code within the same school
  if (data.name || data.code) {
    const existingSubject = await prisma.subject.findFirst({
      where: {
        schoolId,
        name: data.name,
        NOT: { id },
      },
    });

    if (existingSubject) {
      const error = new Error(
        "Subject with this name or code already exists in your school",
      );
      error.statusCode = 400;
      throw error;
    }
  }

  return prisma.subject.update({
    where: { id },
    data,
  });
};

export const deleteSubject = async (id, schoolId) => {
  //  check if the subject exists and belongs to the school
  const subject = await prisma.subject.findFirst({
    where: { id, schoolId },
    include: {
      teacherSubjects: true,
    },
  });

  if (!subject) {
    const error = new Error(
      "Subject not found or does not belong to your school",
    );
    error.statusCode = 404;
    throw error;
  }

  if (subject.teacherSubjects.length > 0) {
    const error = new Error(
      "Cannot delete subject with assigned teacher subjects. Please remove the teacher subjects first.",
    );
    error.statusCode = 400;
    throw error;
  }

  return prisma.subject.delete({
    where: { id },
  });
};
