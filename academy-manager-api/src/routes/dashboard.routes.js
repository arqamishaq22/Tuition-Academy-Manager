import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { roleGuard } from "../middleware/roleGuard.js";
import { validate } from "../middleware/validate.js";
import dashboardController from "../controllers/dashboard.controller.js";
import {
  feesTrendRouteSchema,
  feeStatusRouteSchema,
  feesDueRouteSchema,
  recentActivityRouteSchema,
} from "../validators/dashboard.validator.js";

const router = Router();

// Protect all dashboard routes: owner and staff only
router.use(authenticate, roleGuard("owner", "staff"));

// 1. GET /api/v1/dashboard/overview
router.get("/overview", dashboardController.getOverview);

// 2. GET /api/v1/dashboard/fees-trend?months=6
router.get(
  "/fees-trend",
  validate(feesTrendRouteSchema),
  dashboardController.getFeesTrend
);

// 3. GET /api/v1/dashboard/fee-status?month=&year=
router.get(
  "/fee-status",
  validate(feeStatusRouteSchema),
  dashboardController.getFeeStatus
);

// 4. GET /api/v1/dashboard/attendance-weekly
router.get(
  "/attendance-weekly",
  dashboardController.getAttendanceWeekly
);

// 5. GET /api/v1/dashboard/fees-due?days=7
router.get(
  "/fees-due",
  validate(feesDueRouteSchema),
  dashboardController.getFeesDue
);

// 6. GET /api/v1/dashboard/recent-activity?limit=10
router.get(
  "/recent-activity",
  validate(recentActivityRouteSchema),
  dashboardController.getRecentActivity
);

// 7. GET /api/v1/dashboard/top-classes
router.get("/top-classes", dashboardController.getTopClasses);

export default router;

