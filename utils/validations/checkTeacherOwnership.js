import createHttpError from "../errors/createHttpError.js";

export const checkTeacherOwnership = (role, userId, teacherId) => {
  if (role === "TEACHER" && teacherId !== userId) {
    throw createHttpError(
      403,
      "You are not authorized to access this resources",
    );
  }
};
