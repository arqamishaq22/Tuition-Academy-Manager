import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";
import reportService from "../services/report.service.js";

/**
 * Helper to send either CSV download or JSON response.
 */
function handleReportResponse(res, result) {
  if (result && result.isCsv) {
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${result.filename}"`);
    return res.status(200).send(result.csv);
  }
  return sendSuccess(res, result);
}

/**
 * 1. GET /api/v1/reports/fee-collection?from=&to=&classId=&groupBy=day|month
 * Daily or monthly collection totals, split by payment method.
 */
export const getFeeCollection = asyncHandler(async (req, res) => {
  const result = await reportService.getFeeCollectionReport(req.user.academyId, req.query);
  return handleReportResponse(res, result);
});

/**
 * 2. GET /api/v1/reports/outstanding
 * Unpaid fee balances grouped by class and student.
 */
export const getOutstanding = asyncHandler(async (req, res) => {
  const result = await reportService.getOutstandingReport(req.user.academyId, req.query);
  return handleReportResponse(res, result);
});

/**
 * 3. GET /api/v1/reports/attendance-summary?month=&year=
 * Class-wise attendance percentage and list of students with attendance below 75%.
 */
export const getAttendanceSummary = asyncHandler(async (req, res) => {
  const result = await reportService.getAttendanceSummaryReport(req.user.academyId, req.query);
  return handleReportResponse(res, result);
});

/**
 * 4. GET /api/v1/reports/student-strength
 * Current active students by class, gender, status, and 12-month admission/departure flow.
 */
export const getStudentStrength = asyncHandler(async (req, res) => {
  const result = await reportService.getStudentStrengthReport(req.user.academyId, req.query);
  return handleReportResponse(res, result);
});

/**
 * 5. GET /api/v1/reports/income-vs-teacher-salary?year=
 * Monthly comparison of fee collections against active teacher salaries (profit view).
 */
export const getIncomeVsSalary = asyncHandler(async (req, res) => {
  const result = await reportService.getIncomeVsSalaryReport(req.user.academyId, req.query);
  return handleReportResponse(res, result);
});

/**
 * 6. GET /api/v1/reports/class-performance?examId=
 * Average marks, highest, lowest, and pass rate by subject for an exam.
 */
export const getClassPerformance = asyncHandler(async (req, res) => {
  const result = await reportService.getClassPerformanceReport(req.user.academyId, req.query);
  return handleReportResponse(res, result);
});

export default {
  getFeeCollection,
  getOutstanding,
  getAttendanceSummary,
  getStudentStrength,
  getIncomeVsSalary,
  getClassPerformance,
};
