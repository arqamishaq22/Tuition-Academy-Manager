import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { roleGuard } from "../middleware/roleGuard.js";
import { validate } from "../middleware/validate.js";
import parentController from "../controllers/parent.controller.js";
import {
  studentOnlyRouteSchema,
  parentAttendanceRouteSchema,
  feeReceiptRouteSchema,
  reportCardRouteSchema,
  noticeReadRouteSchema,
} from "../validators/parent.validator.js";

const router = Router();

// Protect all parent routes: Authenticated users with role 'parent' ONLY
router.use(authenticate, roleGuard("parent"));

// 1. GET /api/v1/parent/children
router.get("/children", parentController.getChildren);

// 2. GET /api/v1/parent/children/:studentId/summary
router.get(
  "/children/:studentId/summary",
  validate(studentOnlyRouteSchema),
  parentController.getChildSummary
);

// 3. GET /api/v1/parent/children/:studentId/attendance?month=&year=
router.get(
  "/children/:studentId/attendance",
  validate(parentAttendanceRouteSchema),
  parentController.getChildAttendance
);

// 4. GET /api/v1/parent/children/:studentId/fees
router.get(
  "/children/:studentId/fees",
  validate(studentOnlyRouteSchema),
  parentController.getChildFees
);

// 5. GET /api/v1/parent/children/:studentId/fees/:feeId/receipt
router.get(
  "/children/:studentId/fees/:feeId/receipt",
  validate(feeReceiptRouteSchema),
  parentController.getChildFeeReceipt
);

// 6. GET /api/v1/parent/children/:studentId/results
router.get(
  "/children/:studentId/results",
  validate(studentOnlyRouteSchema),
  parentController.getChildResults
);

// 7. GET /api/v1/parent/children/:studentId/results/:examId/report-card
router.get(
  "/children/:studentId/results/:examId/report-card",
  validate(reportCardRouteSchema),
  parentController.getChildReportCard
);

// 8. GET /api/v1/parent/notices
router.get("/notices", parentController.getParentNotices);

// 9. POST /api/v1/parent/notices/:id/read
router.post(
  "/notices/:id/read",
  validate(noticeReadRouteSchema),
  parentController.markNoticeRead
);

// 10. GET /api/v1/parent/academy-contact
router.get("/academy-contact", parentController.getAcademyContact);

export default router;
