import createHttpError from "../errors/createHttpError.js";

const ensureUniqueEnrollments = (scores) => {
  const enrollmentIds = scores.map((item) => item.enrollmentId);

  const duplicates = enrollmentIds.filter(
    (id, index) => enrollmentIds.indexOf(id) !== index,
  );

  if (duplicates.length > 0) {
    const uniqueDuplicates = [...new Set(duplicates)];

    throw createHttpError(
      400,
      `Duplicate enrollment(s) found in request: ${uniqueDuplicates.join(", ")}.`,
    );
  }
};

export default ensureUniqueEnrollments;
