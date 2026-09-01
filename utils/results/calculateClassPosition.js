const calculateClassPosition = (classEnrollments, currentStudentId) => {
  // Calculate each student's average
  const rankings = classEnrollments.map((enrollment) => {
    const totalObtained = enrollment.scores.reduce(
      (sum, score) => sum + score.obtainedScore,
      0,
    );

    const totalPossible = enrollment.scores.reduce(
      (sum, score) => sum + score.assessment.maxScore,
      0,
    );

    const average =
      totalPossible === 0
        ? 0
        : Number(((totalObtained / totalPossible) * 100).toFixed(2));

    return {
      studentId: enrollment.student.id,
      studentName: enrollment.student.name,
      average,
    };
  });

  // Sort highest average first
  rankings.sort((a, b) => b.average - a.average);

  // Assign positions (supports ties)
  let currentPosition = 1;

  rankings.forEach((student, index) => {
    if (index > 0 && student.average < rankings[index - 1].average) {
      currentPosition = index + 1;
    }

    student.position = currentPosition;
  });

  // Return only the current student
  return rankings.find((student) => student.studentId === currentStudentId);
};

export default calculateClassPosition;
