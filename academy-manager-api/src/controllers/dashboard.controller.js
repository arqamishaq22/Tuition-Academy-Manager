import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";
import dashboardService from "../services/dashboard.service.js";

/**
 * 1. GET /api/v1/dashboard/overview
 * Returns unified card metrics:
 * - totalStudents (active) and change versus last month
 * - todayAttendancePercent and how many classes are not marked yet today
 * - feesCollectedThisMonth, pendingFees, overdueFees, collectionPercent, with change versus last month
 * Cached in memory for 60 seconds per academy.
 */
export const getOverview = asyncHandler(async (req, res) => {
  const result = await dashboardService.getOverview(req.user.academyId);
  return sendSuccess(res, result);
});

/**
 * 2. GET /api/v1/dashboard/fees-trend?months=6
 * Collected fee amount per month for the last N months (zero-filled for chart gaps).
 */
export const getFeesTrend = asyncHandler(async (req, res) => {
  const months = req.query.months ? Number(req.query.months) : 6;
  const result = await dashboardService.getFeesTrend(req.user.academyId, months);
  return sendSuccess(res, result);
});

/**
 * 3. GET /api/v1/dashboard/fee-status?month=&year=
 * Counts and amounts by paid, pending, partial, overdue (for donut charts).
 */
export const getFeeStatus = asyncHandler(async (req, res) => {
  const result = await dashboardService.getFeeStatus(req.user.academyId, req.query);
  return sendSuccess(res, result);
});

/**
 * 4. GET /api/v1/dashboard/attendance-weekly
 * Attendance percentage for each day of the current week (Mon to Sat).
 */
export const getAttendanceWeekly = asyncHandler(async (req, res) => {
  const result = await dashboardService.getAttendanceWeekly(req.user.academyId);
  return sendSuccess(res, result);
});

/**
 * 5. GET /dashboard/fees-due?days=7
 * Students whose fees are due within the next N days or are overdue (limit 10).
 */
export const getFeesDue = asyncHandler(async (req, res) => {
  const days = req.query.days ? Number(req.query.days) : 7;
  const result = await dashboardService.getFeesDue(req.user.academyId, days);
  return sendSuccess(res, result);
});

/**
 * 6. GET /dashboard/recent-activity?limit=10
 * Latest entries from activity_logs written in readable human text.
 */
export const getRecentActivity = asyncHandler(async (req, res) => {
  const limit = req.query.limit ? Number(req.query.limit) : 10;
  const result = await dashboardService.getRecentActivity(req.user.academyId, limit);
  return sendSuccess(res, result);
});

/**
 * 7. GET /dashboard/top-classes
 * Classes ranked by monthly attendance rate.
 */
export const getTopClasses = asyncHandler(async (req, res) => {
  const result = await dashboardService.getTopClasses(req.user.academyId);
  return sendSuccess(res, result);
});

export default {
  getOverview,
  getFeesTrend,
  getFeeStatus,
  getAttendanceWeekly,
  getFeesDue,
  getRecentActivity,
  getTopClasses,
};

