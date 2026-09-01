const calculateClassStatistics = (classEnrollments) => {
  const averages = classEnrollments.map((enrollment) => {
    const totalObtained = enrollment.scores.reduce(
      (sum, score) => sum + score.obtainedScore,
      0,
    );

    const totalPossible = enrollment.scores.reduce(
      (sum, score) => sum + score.assessment.maxScore,
      0,
    );

    return totalPossible === 0
      ? 0
      : Number(((totalObtained / totalPossible) * 100).toFixed(2));
  });

  const classSize = averages.length;

  const highestAverage = classSize ? Math.max(...averages) : 0;

  const lowestAverage = classSize ? Math.min(...averages) : 0;

  const classAverage =
    classSize === 0
      ? 0
      : Number(
          (averages.reduce((sum, avg) => sum + avg, 0) / classSize).toFixed(2),
        );

  return {
    classSize,
    highestAverage,
    lowestAverage,
    classAverage,
  };
};

export default calculateClassStatistics;
