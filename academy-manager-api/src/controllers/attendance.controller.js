import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";
import attendanceService from "../services/attendance.service.js";

export const markAttendance = asyncHandler(async (req, res) => {
  const result = await attendanceService.markAttendance(req.user.academyId, req.body);
  return sendSuccess(res, result);
});

export const getClassAttendance = asyncHandler(async (req, res) => {
  const { classId, date } = req.query;
  const attendanceDate = date || new Date().toISOString().slice(0, 10);
  const records = await attendanceService.getClassAttendance(
    req.user.academyId,
    parseInt(classId, 10),
    attendanceDate
  );
  return sendSuccess(res, records);
});

export const getMonthlySummary = asyncHandler(async (req, res) => {
  const { classId, month } = req.query; // e.g. month = '2026-11'
  const currentMonth = month || new Date().toISOString().slice(0, 7);
  const summary = await attendanceService.getMonthlySummary(
    req.user.academyId,
    parseInt(classId, 10),
    currentMonth
  );
  return sendSuccess(res, summary);
});

export default {
  markAttendance,
  getClassAttendance,
  getMonthlySummary,
};

