import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { roleGuard } from "../middleware/roleGuard.js";
import { validate } from "../middleware/validate.js";
import {
  markAttendanceSchema,
  patchAttendanceRouteSchema,
  classAttendanceRouteSchema,
  historyRouteSchema,
  dayAttendanceRouteSchema,
  studentAttendanceRouteSchema,
  monthlyReportRouteSchema,
  absenteesRouteSchema,
} from "../validators/attendance.validator.js";
import attendanceController from "../controllers/attendance.controller.js";

const router = Router();

// Authentication required for all attendance endpoints
router.use(authenticate);

// 1. GET /report/monthly/export - CSV download of monthly class attendance
router.get(
  "/report/monthly/export",
  roleGuard("owner", "staff", "teacher"),
  validate(monthlyReportRouteSchema),
  attendanceController.exportMonthlyReportCsv
);

// 2. GET /report/monthly - Table of students with counts & <75% low attendance flag
router.get(
  "/report/monthly",
  roleGuard("owner", "staff", "teacher"),
  validate(monthlyReportRouteSchema),
  attendanceController.getMonthlyClassReport
);

// 3. GET /history/day - Daily attendance for a class
router.get(
  "/history/day",
  roleGuard("owner", "staff", "teacher"),
  validate(dayAttendanceRouteSchema),
  attendanceController.getDayAttendance
);

// 4. GET /history - Monthly attendance heatmap and daily percentages for a class
router.get(
  "/history",
  roleGuard("owner", "staff", "teacher"),
  validate(historyRouteSchema),
  attendanceController.getClassAttendanceHistory
);

// 5. GET /absentees - List of absent students for parent notification
router.get(
  "/absentees",
  roleGuard("owner", "staff", "teacher"),
  validate(absenteesRouteSchema),
  attendanceController.getDailyAbsentees
);

// 6. POST /mark - Bulk save / upsert attendance
router.post(
  "/mark",
  roleGuard("owner", "staff", "teacher"),
  validate(markAttendanceSchema),
  attendanceController.markAttendance
);

// 7. GET /class/:classId - Daily roster for marking with stats
router.get(
  "/class/:classId",
  roleGuard("owner", "staff", "teacher"),
  validate(classAttendanceRouteSchema),
  attendanceController.getClassAttendance
);

// 8. GET /student/:studentId - Individual student monthly calendar & percentage
router.get(
  "/student/:studentId",
  roleGuard("owner", "staff", "teacher"),
  validate(studentAttendanceRouteSchema),
  attendanceController.getStudentAttendance
);

// 9. PATCH /:id - Edit single record (owner or staff only)
router.patch(
  "/:id",
  roleGuard("owner", "staff"),
  validate(patchAttendanceRouteSchema),
  attendanceController.updateAttendanceRecord
);

export default router;
