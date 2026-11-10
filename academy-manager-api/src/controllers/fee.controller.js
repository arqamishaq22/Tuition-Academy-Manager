import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";
import { getPagination } from "../utils/pagination.js";
import feeService from "../services/fee.service.js";

/**
 * 1. POST /api/v1/fees/generate
 * Bulk generate monthly fees for active students.
 */
export const generateMonthlyFees = asyncHandler(async (req, res) => {
  const result = await feeService.generateMonthlyFees(req.user.academyId, req.body);
  return sendSuccess(res, result, null, 201);
});

/**
 * 2. GET /api/v1/fees
 * List fees with filters, pagination, and sorting.
 */
export const getFeesList = asyncHandler(async (req, res) => {
  const { limit, offset, formatMeta } = getPagination(req, 10);
  const { fees, total } = await feeService.getFeesList(req.user.academyId, {
    ...req.query,
    limit,
    offset,
  });
  return sendSuccess(res, fees, formatMeta(total));
});

/**
 * 3. GET /api/v1/fees/summary
 * Summary of fee collection for a month.
 */
export const getFeeSummary = asyncHandler(async (req, res) => {
  const result = await feeService.getFeeSummary(req.user.academyId, req.query);
  return sendSuccess(res, result);
});

/**
 * 4. GET /api/v1/fees/student/:studentId
 * Full fee ledger and payment history of one student.
 */
export const getStudentFeeHistory = asyncHandler(async (req, res) => {
  const studentId = parseInt(req.params.studentId, 10);
  const result = await feeService.getStudentFeeHistory(req.user.academyId, studentId);
  return sendSuccess(res, result);
});

/**
 * 5. POST /api/v1/fees/payments
 * Collect fee payment (single fee or multi-month allocation).
 */
export const collectPayment = asyncHandler(async (req, res) => {
  const result = await feeService.collectPayment(req.user.academyId, req.user.id, req.body);
  return sendSuccess(res, result, null, 201);
});

/**
 * 6. GET /api/v1/fees/payments
 * List payment transactions with range totals and pagination.
 */
export const getPaymentsList = asyncHandler(async (req, res) => {
  const { limit, offset, formatMeta } = getPagination(req, 10);
  const { payments, rangeTotals, total } = await feeService.getPaymentsList(req.user.academyId, {
    ...req.query,
    limit,
    offset,
  });
  const meta = {
    ...formatMeta(total),
    rangeTotals,
  };
  return sendSuccess(res, payments, meta);
});

/**
 * 7. GET /api/v1/fees/payments/:id/receipt
 * Receipt payload formatted for print and digital display.
 */
export const getReceiptDetails = asyncHandler(async (req, res) => {
  const paymentId = parseInt(req.params.id, 10);
  const result = await feeService.getReceiptDetails(req.user.academyId, paymentId);
  return sendSuccess(res, result);
});

/**
 * 8. DELETE /api/v1/fees/payments/:id
 * Reverses a payment transaction (Owner only).
 */
export const reversePayment = asyncHandler(async (req, res) => {
  const paymentId = parseInt(req.params.id, 10);
  const { reason } = req.body;
  const result = await feeService.reversePayment(req.user.academyId, req.user.id, paymentId, reason);
  return sendSuccess(res, result);
});

/**
 * 9. PATCH /api/v1/fees/:id
 * Adjusts fee amount, late fee, or due date (Owner only).
 */
export const adjustFee = asyncHandler(async (req, res) => {
  const feeId = parseInt(req.params.id, 10);
  const result = await feeService.adjustFee(req.user.academyId, req.user.id, feeId, req.body);
  return sendSuccess(res, result);
});

/**
 * 10. GET /api/v1/fees/defaulters
 * Lists students with overdue unpaid fees across 1 or more months.
 */
export const getDefaulters = asyncHandler(async (req, res) => {
  const result = await feeService.getDefaulters(req.user.academyId, req.query);
  return sendSuccess(res, result);
});

/**
 * 11. GET /api/v1/fees/export
 * Downloads CSV of the monthly fee ledger.
 */
export const exportFeesCsv = asyncHandler(async (req, res) => {
  const { csv, filename } = await feeService.exportFeesCsv(req.user.academyId, req.query);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  return res.status(200).send(csv);
});

/**
 * 12a. GET /api/v1/fees/structure
 * Get monthly fee structure per class.
 */
export const getFeeStructure = asyncHandler(async (req, res) => {
  const result = await feeService.getFeeStructure(req.user.academyId);
  return sendSuccess(res, result);
});

/**
 * 12b. PUT /api/v1/fees/structure
 * Update class monthly fees and optionally cascade to active students.
 */
export const updateFeeStructure = asyncHandler(async (req, res) => {
  const result = await feeService.updateFeeStructure(req.user.academyId, req.user.id, req.body);
  return sendSuccess(res, result);
});

export default {
  generateMonthlyFees,
  getFeesList,
  getFeeSummary,
  getStudentFeeHistory,
  collectPayment,
  getPaymentsList,
  getReceiptDetails,
  reversePayment,
  adjustFee,
  getDefaulters,
  exportFeesCsv,
  getFeeStructure,
  updateFeeStructure,
};
