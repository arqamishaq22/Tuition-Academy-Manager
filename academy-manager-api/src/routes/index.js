import { Router } from "express";
import { pool } from "../config/db.js";
import { sendSuccess } from "../utils/response.js";
import authRoutes from "./auth.routes.js";
import studentRoutes from "./student.routes.js";
import classRoutes from "./class.routes.js";
import teacherRoutes from "./teacher.routes.js";
import attendanceRoutes from "./attendance.routes.js";
import feeRoutes from "./fee.routes.js";
import examRoutes from "./exam.routes.js";
import dashboardRoutes from "./dashboard.routes.js";
import reportRoutes from "./report.routes.js";

const router = Router();

/**
 * Health check endpoint.
 * Runs 'SELECT 1' against the database and returns service status.
 */
router.get("/health", async (req, res, next) => {
  try {
    let dbStatus = "connected";
    try {
      await pool.query("SELECT 1");
    } catch (dbErr) {
      dbStatus = "disconnected";
    }

    return sendSuccess(res, {
      status: "ok",
      db: dbStatus,
      time: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// Mount modular sub-routers
router.use("/auth", authRoutes);
router.use("/students", studentRoutes);
router.use("/classes", classRoutes);
router.use("/teachers", teacherRoutes);
router.use("/attendance", attendanceRoutes);
router.use("/fees", feeRoutes);
router.use("/exams", examRoutes);
router.use("/results", examRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/reports", reportRoutes);

export default router;

