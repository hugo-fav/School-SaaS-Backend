import express from "express";

import { protect } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/authorization.middleware.js";
import { getStudentResults } from "./result.controller.js";


const router = express.Router();

router.get(
  "/student/:studentId",
  protect,
  authorize("ADMIN", "TEACHER"),
  getStudentResults,
);

export default router;
