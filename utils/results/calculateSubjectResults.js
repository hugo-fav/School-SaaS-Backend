import getGrade from "../calculations/getGrade.js";

const calculateSubjectResults = (groupedSubjects) => {
  const subjectResults = [];

  for (const subjectData of Object.values(groupedSubjects)) {
    const totalScore = subjectData.assessments.reduce(
      (sum, assessment) => sum + assessment.obtainedScore,
      0,
    );

    const totalPossible = subjectData.assessments.reduce(
      (sum, assessment) => sum + assessment.maxScore,
      0,
    );

    const percentage =
      totalPossible === 0
        ? 0
        : Number(((totalScore / totalPossible) * 100).toFixed(2));

    const { grade, remark } = getGrade(percentage);

    subjectResults.push({
      subject: subjectData.subject,
      teacher: subjectData.teacher,
      assessments: subjectData.assessments,
      totalScore,
      totalPossible,
      percentage,
      grade,
      remark,
    });
  }

  return subjectResults;
};

export default calculateSubjectResults;
