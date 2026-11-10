import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";
import reminderService from "../services/reminder.service.js";

/**
 * 1. POST /api/v1/reminders/fees/preview
 * Generate personalized fee reminder message previews & wa.me links.
 */
export const previewFeeReminders = asyncHandler(async (req, res) => {
  const result = await reminderService.previewFeeReminders(req.user.academyId, req.body);
  return sendSuccess(res, result);
});

/**
 * 2. POST /api/v1/reminders/fees/send
 * Log reminders as sent and enforce 24-hour rate limit.
 */
export const sendFeeReminders = asyncHandler(async (req, res) => {
  const result = await reminderService.sendFeeReminders(req.user.academyId, req.body);
  return sendSuccess(res, result);
});

/**
 * 3. POST /api/v1/reminders/absent
 * Build absent student WhatsApp notification alerts.
 */
export const previewAbsentReminders = asyncHandler(async (req, res) => {
  const result = await reminderService.previewAbsentReminders(req.user.academyId, req.body);
  return sendSuccess(res, result);
});

/**
 * 4. POST /api/v1/reminders/receipt/:paymentId
 * Build payment receipt message with link.
 */
export const buildReceiptReminder = asyncHandler(async (req, res) => {
  const result = await reminderService.buildReceiptReminder(
    req.user.academyId,
    req.params.paymentId
  );
  return sendSuccess(res, result);
});

/**
 * 5. POST /api/v1/reminders/result/:examId/:studentId
 * Build exam result message with link.
 */
export const buildResultReminder = asyncHandler(async (req, res) => {
  const result = await reminderService.buildResultReminder(
    req.user.academyId,
    req.params.examId,
    req.params.studentId
  );
  return sendSuccess(res, result);
});

/**
 * 6. GET /api/v1/reminders/logs
 * List dispatched reminders with filters & pagination.
 */
export const getReminderLogs = asyncHandler(async (req, res) => {
  const result = await reminderService.getReminderLogs(req.user.academyId, req.query);
  return sendSuccess(res, result.logs, {
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: result.totalPages,
  });
});

/**
 * 7. GET /api/v1/reminders/queue
 * List pending queued reminders (e.g. from due-soon cron).
 */
export const getQueuedReminders = asyncHandler(async (req, res) => {
  const result = await reminderService.getQueuedReminders(req.user.academyId);
  return sendSuccess(res, result);
});

/**
 * 8. POST /api/v1/reminders/queue/send
 * Mark queued reminders as sent.
 */
export const sendQueuedReminders = asyncHandler(async (req, res) => {
  const result = await reminderService.sendQueuedReminders(req.user.academyId, req.body);
  return sendSuccess(res, result);
});

export default {
  previewFeeReminders,
  sendFeeReminders,
  previewAbsentReminders,
  buildReceiptReminder,
  buildResultReminder,
  getReminderLogs,
  getQueuedReminders,
  sendQueuedReminders,
};
