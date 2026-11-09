import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";
import attendanceService from "../services/attendance.service.js";

// 1. GET /class/:classId?date=YYYY-MM-DD
export const getClassAttendance = asyncHandler(async (req, res) => {
  const classId = parseInt(req.params.classId, 10);
  const { date } = req.query;

  const result = await attendanceService.getClassAttendance(
    req.user.academyId,
    classId,
    date,
    req.user
  );
  return sendSuccess(res, result);
});

// 2. POST /mark (Bulk save)
export const markAttendance = asyncHandler(async (req, res) => {
  const result = await attendanceService.markAttendance(
    req.user.academyId,
    req.body,
    req.user
  );
  return sendSuccess(res, result, null, 201);
});

// 3. PATCH /:id (Edit one record - owner or staff only)
export const updateAttendanceRecord = asyncHandler(async (req, res) => {
  const attendanceId = parseInt(req.params.id, 10);
  const result = await attendanceService.updateAttendanceRecord(
    req.user.academyId,
    attendanceId,
    req.body,
    req.user
  );
  return sendSuccess(res, result);
});

// 4. GET /history?classId=&month=&year=
export const getClassAttendanceHistory = asyncHandler(async (req, res) => {
  const classId = parseInt(req.query.classId, 10);
  const { month, year } = req.query;

  const result = await attendanceService.getClassAttendanceHistory(
    req.user.academyId,
    classId,
    month,
    year,
    req.user
  );
  return sendSuccess(res, result);
});

// 5. GET /history/day?classId=&date=
export const getDayAttendance = asyncHandler(async (req, res) => {
  const classId = parseInt(req.query.classId, 10);
  const { date } = req.query;

  const result = await attendanceService.getClassAttendance(
    req.user.academyId,
    classId,
    date,
    req.user
  );
  return sendSuccess(res, result);
});

// 6. GET /student/:studentId?month=&year=
export const getStudentAttendance = asyncHandler(async (req, res) => {
  const studentId = parseInt(req.params.studentId, 10);
  const { month, year } = req.query;

  const result = await attendanceService.getStudentAttendance(
    req.user.academyId,
    studentId,
    month,
    year,
    req.user
  );
  return sendSuccess(res, result);
});

// 7. GET /report/monthly?classId=&month=&year=
export const getMonthlyClassReport = asyncHandler(async (req, res) => {
  const classId = parseInt(req.query.classId, 10);
  const { month, year } = req.query;

  const result = await attendanceService.getMonthlyClassReport(
    req.user.academyId,
    classId,
    month,
    year,
    req.user
  );
  return sendSuccess(res, result);
});

// 8. GET /absentees?date=
export const getDailyAbsentees = asyncHandler(async (req, res) => {
  const { date } = req.query;

  const result = await attendanceService.getDailyAbsentees(
    req.user.academyId,
    date,
    req.user
  );
  return sendSuccess(res, result);
});

// 9. GET /report/monthly/export?classId=&month=&year=
export const exportMonthlyReportCsv = asyncHandler(async (req, res) => {
  const classId = parseInt(req.query.classId, 10);
  const { month, year } = req.query;

  const csvData = await attendanceService.exportMonthlyReportCsv(
    req.user.academyId,
    classId,
    month,
    year,
    req.user
  );

  const filename = `attendance-report-class${classId}-${year || "curr"}-${month || "curr"}.csv`;
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  return res.status(200).send(csvData);
});

export default {
  getClassAttendance,
  markAttendance,
  updateAttendanceRecord,
  getClassAttendanceHistory,
  getDayAttendance,
  getStudentAttendance,
  getMonthlyClassReport,
  getDailyAbsentees,
  exportMonthlyReportCsv,
};
