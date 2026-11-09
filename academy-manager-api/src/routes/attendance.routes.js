import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { roleGuard } from "../middleware/roleGuard.js";
import { validate } from "../middleware/validate.js";
import { markAttendanceSchema } from "../validators/attendance.validator.js";
import attendanceController from "../controllers/attendance.controller.js";

const router = Router();

router.use(authenticate);

router.post(
  "/mark",
  roleGuard("admin", "owner", "teacher", "staff"),
  validate(markAttendanceSchema),
  attendanceController.markAttendance
);
router.get("/class", attendanceController.getClassAttendance);
router.get("/summary", attendanceController.getMonthlySummary);

export default router;
