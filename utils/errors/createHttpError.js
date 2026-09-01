import AppError from "./AppErrors.js";

const createHttpError = (statusCode, message) => {
  return new AppError(message, statusCode);
};

export default createHttpError;
