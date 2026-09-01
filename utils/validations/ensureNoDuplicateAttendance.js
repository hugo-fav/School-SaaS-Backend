import createHttpError from "../../utils/errors/createHttpError.js";

export const ensureNoDuplicateAttendance = (attendance) => {
  const enrollmentIds = attendance.map((item) => item.enrollmentId);

  const uniqueEnrollmentIds = new Set(enrollmentIds);

  if (uniqueEnrollmentIds.size !== enrollmentIds.length) {
    throw createHttpError(
      400,
      "Duplicate attendance records found for one or more students",
    );
  }
};
