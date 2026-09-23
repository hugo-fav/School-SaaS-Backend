import express from "express";
import cors from "cors";
import schoolRoute from "./modules/schools/school.route.js";
import studentRoute from "./modules/students/student.route.js";
import teacherRoute from "./modules/teachers/teacher.route.js";
import classRoute from "./modules/classes/class.route.js";
import authRoute from "./modules/auth/auth.routes.js";
import sessionRoutes from "./modules/academic-sessions/sessions.routes.js";
import termRoutes from "./modules/terms/terms.routes.js";
import subjectRoutes from "./modules/subjects/subjects.route.js";
import teacherSubjectRoutes from "./modules/teacherSubjects/teacherSubjects.routes.js";
import assessmentRoutes from "./modules/assessments/assessments.routes.js";
import scoreRoute from "./modules/scores/scores.routes.js";
import enrollmentRoutes from "./modules/enrollments/enrollments.routes.js";
import attendanceRoutes from "./modules/attendance/attendance.routes.js";
import promotionHistoryRoutes from "./modules/promotion-history/promotionHistory.route.js";
import resultRoutes from "./modules/result/result.route.js";
import reportCardRoutes from "./modules/report-card/reportCard.route.js";
import feeRoutes from "./modules/fee/fee.route.js";
import invoiceRoutes from "./modules/invoices/invoice.route.js";
import paymentRoutes from "./modules/payments/payment.routes.js";
import paymentWebhookRoutes from "./modules/payments/payment.webhook.route.js";

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://school-saas-backend-30z2.onrender.com",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use("/api/v1/auth", authRoute);
app.use("/api/v1/schools", schoolRoute);
app.use("/api/v1/students", studentRoute);
app.use("/api/v1/teachers", teacherRoute);
app.use("/api/v1/classes", classRoute);
app.use("/api/v1/sessions", sessionRoutes);
app.use("/api/v1/terms", termRoutes);
app.use("/api/v1/subjects", subjectRoutes);
app.use("/api/v1/teacher-subjects", teacherSubjectRoutes);
app.use("/api/v1/assessments", assessmentRoutes);
app.use("/api/v1/enrollments", enrollmentRoutes);
app.use("/api/v1/scores", scoreRoute);
app.use("/api/v1/attendance", attendanceRoutes);
app.use("/api/v1/promotion-history", promotionHistoryRoutes);
app.use("/api/v1/results", resultRoutes);
app.use("/api/v1/report-cards", reportCardRoutes);
app.use("/api/v1/fees", feeRoutes);
app.use("/api/v1/invoices", invoiceRoutes);
app.use("/api/v1/payments", paymentRoutes);
app.use("/api/v1/payments/webhook", paymentWebhookRoutes);

app.get("/", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "School SaaS API is running 🚀",
  });
});

app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    success: false,
    message: "Something went wrong",
  });
});

export default app;
