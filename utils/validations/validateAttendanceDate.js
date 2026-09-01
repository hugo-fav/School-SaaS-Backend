import createHttpError from "../../utils/errors/createHttpError.js";

export const validateAttendanceDate = (date) => {
  if (!date) {
    throw createHttpError(400, "Attendance date is required.");
  }

  const attendanceDate = new Date(date);

  if (Number.isNaN(attendanceDate.getTime())) {
    throw createHttpError(400, "Invalid attendance date");
  }

  return attendanceDate;
};
