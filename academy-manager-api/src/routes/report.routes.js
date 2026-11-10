import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { roleGuard } from "../middleware/roleGuard.js";
import { validate } from "../middleware/validate.js";
import reportController from "../controllers/report.controller.js";
import {
  feeCollectionRouteSchema,
  outstandingRouteSchema,
  attendanceRouteSchema,
  studentStrengthRouteSchema,
  incomeVsSalaryRouteSchema,
  classPerformanceRouteSchema,
} from "../validators/report.validator.js";

const router = Router();

// Protect all reports: owner and staff only
router.use(authenticate, roleGuard("owner", "staff"));

// 1. GET /api/v1/reports/fee-collection?from=&to=&classId=&groupBy=day|month
router.get(
  "/fee-collection",
  validate(feeCollectionRouteSchema),
  reportController.getFeeCollection
);

// 2. GET /api/v1/reports/outstanding
router.get(
  "/outstanding",
  validate(outstandingRouteSchema),
  reportController.getOutstanding
);

// 3. GET /api/v1/reports/attendance-summary?month=&year=
router.get(
  "/attendance-summary",
  validate(attendanceRouteSchema),
  reportController.getAttendanceSummary
);

// 4. GET /api/v1/reports/student-strength
router.get(
  "/student-strength",
  validate(studentStrengthRouteSchema),
  reportController.getStudentStrength
);

// 5. GET /api/v1/reports/income-vs-teacher-salary?year=
router.get(
  "/income-vs-teacher-salary",
  validate(incomeVsSalaryRouteSchema),
  reportController.getIncomeVsSalary
);

// 6. GET /api/v1/reports/class-performance?examId=
router.get(
  "/class-performance",
  validate(classPerformanceRouteSchema),
  reportController.getClassPerformance
);

export default router;
