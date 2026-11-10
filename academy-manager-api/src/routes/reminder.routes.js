import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { roleGuard } from "../middleware/roleGuard.js";
import { validate } from "../middleware/validate.js";
import reminderController from "../controllers/reminder.controller.js";
import {
  feePreviewRouteSchema,
  feeSendRouteSchema,
  absentReminderRouteSchema,
  receiptParamRouteSchema,
  examStudentRouteSchema,
  reminderLogsRouteSchema,
  queueSendRouteSchema,
} from "../validators/reminder.validator.js";

const router = Router();

// Protect all reminders endpoints: owner and staff only
router.use(authenticate, roleGuard("owner", "staff"));

// 1. POST /api/v1/reminders/fees/preview
router.post(
  "/fees/preview",
  validate(feePreviewRouteSchema),
  reminderController.previewFeeReminders
);

// 2. POST /api/v1/reminders/fees/send
router.post(
  "/fees/send",
  validate(feeSendRouteSchema),
  reminderController.sendFeeReminders
);

// 3. POST /api/v1/reminders/absent
router.post(
  "/absent",
  validate(absentReminderRouteSchema),
  reminderController.previewAbsentReminders
);

// 4. POST /api/v1/reminders/receipt/:paymentId
router.post(
  "/receipt/:paymentId",
  validate(receiptParamRouteSchema),
  reminderController.buildReceiptReminder
);

// 5. POST /api/v1/reminders/result/:examId/:studentId
router.post(
  "/result/:examId/:studentId",
  validate(examStudentRouteSchema),
  reminderController.buildResultReminder
);

// 6. GET /api/v1/reminders/logs
router.get(
  "/logs",
  validate(reminderLogsRouteSchema),
  reminderController.getReminderLogs
);

// 7. GET /api/v1/reminders/queue
router.get("/queue", reminderController.getQueuedReminders);

// 8. POST /api/v1/reminders/queue/send
router.post(
  "/queue/send",
  validate(queueSendRouteSchema),
  reminderController.sendQueuedReminders
);

export default router;
