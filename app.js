import express from "express";
import schoolRoute from "./modules/schools/school.route.js";
import studentRoute from "./modules/students/student.route.js";
import teacherRoute from "./modules/teachers/teacher.route.js";
import classRoute from "./modules/classes/class.route.js";
import authRoute from "./modules/auth/auth.routes.js";

const app = express();

app.use(express.json());
app.use("/api/v1/auth", authRoute);
app.use("/api/v1/schools", schoolRoute);
app.use("/api/v1/students", studentRoute);
app.use("/api/v1/teachers", teacherRoute);
app.use("/api/v1/classes", classRoute);

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
