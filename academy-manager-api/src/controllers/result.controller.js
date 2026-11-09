import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";
import resultService from "../services/result.service.js";

export const getExams = asyncHandler(async (req, res) => {
  const { classId } = req.query;
  const exams = await resultService.getExams(
    req.user.academyId,
    classId ? parseInt(classId, 10) : undefined
  );
  return sendSuccess(res, exams);
});

export const createExam = asyncHandler(async (req, res) => {
  const created = await resultService.createExam(req.user.academyId, req.body);
  return sendSuccess(res, created, null, 201);
});

export const saveMarks = asyncHandler(async (req, res) => {
  const result = await resultService.saveMarks(req.user.academyId, req.body);
  return sendSuccess(res, result);
});

export const getReportCard = asyncHandler(async (req, res) => {
  const report = await resultService.getReportCard(req.user.academyId, req.params.studentId);
  return sendSuccess(res, report);
});

export default {
  getExams,
  createExam,
  saveMarks,
  getReportCard,
};

