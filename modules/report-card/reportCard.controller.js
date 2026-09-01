import * as reportCardService from "./reportCard.service.js";

export const generateReportCard = async (req, res) => {
  const report = await reportCardService.generateReportCard(req.body, req.user);

  res.status(201).json({
    message: "Report card generated successfully",
    data: report,
  });
};

export const getReportCard = async (req, res) => {
  const { studentId } = req.params;
  const { sessionId, termId } = req.query;

  const reportCard = await reportCardService.getReportCard(
    studentId,
    sessionId,
    termId,
    req.user,
  );

  res.status(200).json({
    message: "report card retrieved successfully",
    data: reportCard,
  });
};

export const updateTeacherRemark = async (req, res) => {
  const reportCard = await reportCardService.updateTeacherRemark(
    req.params.id,
    req.body,
    req.user,
  );

  res.status(200).json({
    message: "Teacher remark updated successfully",
    data: reportCard,
  });
};

export const updatePrincipalRemark = async (req, res) => {
  const reportCard = await reportCardService.updatePrincipalRemark(
    req.params.id,
    req.body,
    req.user,
  );

  res.status(200).json({
    message: "Principal remark updated successfully",
    data: reportCard,
  });
};

export const getStudentReportCard = async (req, res) => {
  const { studentId } = req.params;
  const { sessionId, termId } = req.query;

  const reportCard = await reportCardService.getStudentReportCard(
    studentId,
    sessionId,
    termId,
    req.user,
  );

  res.status(200).json({
    message: "Report card retrieved successfully",
    data: reportCard,
  });
};

export const getClassReportCards = async (req, res) => {
  const { classId } = req.params;
  const { sessionId, termId } = req.query;

  const reportCards = await reportCardService.getClassReportCards(
    classId,
    sessionId,
    termId,
    req.user,
  );

  res.status(200).json({
    message: "Class report cards retrieved successfully",
    data: reportCards,
  });
};

export const publishReportCard = async (req, res) => {
  const reportCard = await reportCardService.publishReportCard(
    req.params.id,
    req.user,
  );

  res.status(200).json({
    message: "Report card published successfully",
    data: reportCard,
  });
};
