import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";
import parentService from "../services/parent.service.js";

/**
 * 1. GET /api/v1/parent/children
 * List all children of the authenticated parent.
 */
export const getChildren = asyncHandler(async (req, res) => {
  const result = await parentService.getChildrenList(req.user.id, req.user.academyId);
  return sendSuccess(res, result);
});

/**
 * 2. GET /api/v1/parent/children/:studentId/summary
 * Header data and overview summary for one child.
 */
export const getChildSummary = asyncHandler(async (req, res) => {
  const result = await parentService.getChildSummary(
    req.user.id,
    req.params.studentId,
    req.user.academyId
  );
  return sendSuccess(res, result);
});

/**
 * 3. GET /api/v1/parent/children/:studentId/attendance?month=&year=
 * Attendance calendar and summary for one child.
 */
export const getChildAttendance = asyncHandler(async (req, res) => {
  const result = await parentService.getChildAttendance(
    req.user.id,
    req.params.studentId,
    req.user.academyId,
    req.query
  );
  return sendSuccess(res, result);
});

/**
 * 4. GET /api/v1/parent/children/:studentId/fees
 * Full fee ledger with payments and balances for one child.
 */
export const getChildFees = asyncHandler(async (req, res) => {
  const result = await parentService.getChildFees(
    req.user.id,
    req.params.studentId,
    req.user.academyId
  );
  return sendSuccess(res, result);
});

/**
 * 5. GET /api/v1/parent/children/:studentId/fees/:feeId/receipt
 * Official receipt for a fee payment.
 */
export const getChildFeeReceipt = asyncHandler(async (req, res) => {
  const result = await parentService.getChildFeeReceipt(
    req.user.id,
    req.params.studentId,
    req.params.feeId,
    req.user.academyId
  );
  return sendSuccess(res, result);
});

/**
 * 6. GET /api/v1/parent/children/:studentId/results
 * All published exam results for one child.
 */
export const getChildResults = asyncHandler(async (req, res) => {
  const result = await parentService.getChildResults(
    req.user.id,
    req.params.studentId,
    req.user.academyId
  );
  return sendSuccess(res, result);
});

/**
 * 7. GET /api/v1/parent/children/:studentId/results/:examId/report-card
 * Detailed printable report card for one exam.
 */
export const getChildReportCard = asyncHandler(async (req, res) => {
  const result = await parentService.getChildReportCard(
    req.user.id,
    req.params.studentId,
    req.params.examId,
    req.user.academyId
  );
  return sendSuccess(res, result);
});

/**
 * 8. GET /api/v1/parent/notices
 * Notices visible to this parent.
 */
export const getParentNotices = asyncHandler(async (req, res) => {
  const result = await parentService.getParentNotices(req.user.id, req.user.academyId);
  return sendSuccess(res, result);
});

/**
 * 9. POST /api/v1/parent/notices/:id/read
 * Mark a notice as read by the parent.
 */
export const markNoticeRead = asyncHandler(async (req, res) => {
  const result = await parentService.markNoticeRead(
    req.user.id,
    req.params.id,
    req.user.academyId
  );
  return sendSuccess(res, result);
});

/**
 * 10. GET /api/v1/parent/academy-contact
 * Academy contact details and WhatsApp chat button.
 */
export const getAcademyContact = asyncHandler(async (req, res) => {
  const result = await parentService.getAcademyContact(req.user.academyId);
  return sendSuccess(res, result);
});

export default {
  getChildren,
  getChildSummary,
  getChildAttendance,
  getChildFees,
  getChildFeeReceipt,
  getChildResults,
  getChildReportCard,
  getParentNotices,
  markNoticeRead,
  getAcademyContact,
};
