import createHttpError from "../errors/createHttpError.js";

export const validateDateWithinRange = (date, start, end, field = "Date") => {
  const value = new Date(date);

  if (value < start || value > end) {
    throw createHttpError(400, `${field} must fall within the allowed period`);
  }
};
