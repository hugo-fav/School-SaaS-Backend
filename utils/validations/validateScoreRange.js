import createHttpError from "../errors/createHttpError.js";

const validateScoreRange = (score, maxScore) => {
  // score is required
  if (score === undefined || score === null) {
    throw createHttpError(400, "Score is required");
  }

  //    Must be a number
  if (typeof score !== "number" || Number.isNaN(score)) {
    throw createHttpError(400, "Score must be a valid number");
  }

  //   Cannot be negative
  if (score < 0) {
    throw createHttpError(400, "Score cannot be less than zero");
  }

  //   Cannot exceed assessment maximum
  if (score > maxScore) {
    throw createHttpError(
      400,
      `score cannot be greater than the maximum score of ${maxScore}`,
    );
  }
};

export default validateScoreRange;
