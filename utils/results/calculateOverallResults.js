import getGrade from "../calculations/getGrade.js";

const calculateOverallResult = (subjectResults) => {
  const totalSubjects = subjectResults.length;

  const totalObtained = subjectResults.reduce(
    (sum, subject) => sum + subject.totalScore,
    0,
  );

  const totalPossible = subjectResults.reduce(
    (sum, subject) => sum + subject.totalPossible,
    0,
  );

  const average =
    totalPossible === 0
      ? 0
      : Number(((totalObtained / totalPossible) * 100).toFixed(2));

  const overallGrade = getGrade(average);

  return {
    totalSubjects,
    totalObtained,
    totalPossible,
    average,
    overallGrade,
  };
};

export default calculateOverallResult;
