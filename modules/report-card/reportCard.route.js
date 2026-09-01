import express from "express";

import { protect } from "../../middlewares/auth.middleware.js";
import asyncHandler from "../../utils/asyncHandler.js";
import * as reportCardController from "./reportCard.controller.js";
import { authorize } from "../../middlewares/authorization.middleware.js";

const router = express.Router();

router.post(
  "/generate",
  protect,
  authorize("ADMIN"),
  asyncHandler(reportCardController.generateReportCard),
);

router.get(
  "/:studentId",
  protect,
  authorize("ADMIN", "TEACHER"),
  asyncHandler(reportCardController.getReportCard),
);

router.patch(
  "/:id/teacher-remark",
  protect,
  authorize("ADMIN", "TEACHER"),
  asyncHandler(reportCardController.updateTeacherRemark),
);

router.patch(
  "/:id/principal-remark",
  protect,
  authorize("ADMIN"),
  asyncHandler(reportCardController.updatePrincipalRemark),
);

router.get(
  "/student/:studentId",
  protect,
  authorize("STUDENT"),
  asyncHandler(reportCardController.getStudentReportCard),
);

router.get(
  "/class/:classId",
  protect,
  authorize("ADMIN", "TEACHER"),
  asyncHandler(reportCardController.getClassReportCards),
);

router.patch(
  "/:id/publish",
  protect,
  authorize("ADMIN"),
  asyncHandler(reportCardController.publishReportCard),
);

export default router;
