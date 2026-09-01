import createHttpError from "../errors/createHttpError.js";

export const validatePositiveNumber = (value, field) => {
  if (typeof value !== "number" || Number.isNaN(value) || value <= 0) {
    throw createHttpError(400, `${field} must be greater then zero`);
  }
};
