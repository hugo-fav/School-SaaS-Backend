const groupScoresBySubject = (scores) => {
  const groupedSubjects = {};

  for (const score of scores) {
    const subject = score.assessment.teacherSubject.subject;
    const teacher = score.assessment.teacherSubject.teacher;

    const subjectId = subject.id;

    if (!groupedSubjects[subjectId]) {
      groupedSubjects[subjectId] = {
        subject,
        teacher,
        assessments: [],
      };
    }

    groupedSubjects[subjectId].assessments.push({
      id: score.assessment.id,
      title: score.assessment.title,
      type: score.assessment.type,
      maxScore: score.assessment.maxScore,
      obtainedScore: score.obtainedScore,
    });
  }

  return groupedSubjects;
};

export default groupScoresBySubject;
