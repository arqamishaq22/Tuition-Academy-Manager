import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";
import { getPagination } from "../utils/pagination.js";
import examService from "../services/exam.service.js";

/**
 * 1. GET /api/v1/exams
 * List exams with filters and entry progress metrics.
 */
export const getExams = asyncHandler(async (req, res) => {
  const { limit, offset, page, formatMeta } = getPagination(req, 10);
  const { exams, total } = await examService.getExamsList(req.user.academyId, req.user, {
    ...req.query,
    page,
    limit,
    offset,
  });
  return sendSuccess(res, exams, formatMeta(total));
});

/**
 * 2. POST /api/v1/exams
 * Create a new examination with subjects and passing criteria.
 */
export const createExam = asyncHandler(async (req, res) => {
  const result = await examService.createExam(req.user.academyId, req.user, req.body);
  return sendSuccess(res, result, null, 201);
});

/**
 * 3. GET /api/v1/exams/:id
 * Exam details, assigned subjects, and full performance summary.
 */
export const getExamDetails = asyncHandler(async (req, res) => {
  const examId = parseInt(req.params.id, 10);
  const result = await examService.getExamDetails(req.user.academyId, req.user, examId);
  return sendSuccess(res, result);
});

/**
 * 4a. PUT /api/v1/exams/:id
 * Update examination header details.
 */
export const updateExam = asyncHandler(async (req, res) => {
  const examId = parseInt(req.params.id, 10);
  const result = await examService.updateExam(req.user.academyId, req.user, examId, req.body);
  return sendSuccess(res, result);
});

/**
 * 4b. DELETE /api/v1/exams/:id
 * Delete examination (force required if marks exist).
 */
export const deleteExam = asyncHandler(async (req, res) => {
  const examId = parseInt(req.params.id, 10);
  const force = req.query.force === "true" || req.query.force === true;
  const result = await examService.deleteExam(req.user.academyId, req.user, examId, force);
  return sendSuccess(res, result);
});

/**
 * 5. GET /api/v1/exams/:id/marks?subjectId=
 * View student roster and score status for an exam subject.
 */
export const getExamSubjectMarks = asyncHandler(async (req, res) => {
  const examId = parseInt(req.params.id, 10);
  const subjectId = parseInt(req.query.subjectId, 10);
  const result = await examService.getExamSubjectMarks(req.user.academyId, req.user, examId, subjectId);
  return sendSuccess(res, result);
});

/**
 * 6. POST /api/v1/exams/:id/marks
 * Bulk save marks for an exam subject.
 */
export const saveExamMarks = asyncHandler(async (req, res) => {
  const examId = parseInt(req.params.id, 10);
  const result = await examService.saveExamMarks(req.user.academyId, req.user, examId, req.body);
  return sendSuccess(res, result);
});

/**
 * 7a. POST /api/v1/exams/:id/publish
 * Publish exam results (checks that all marks are recorded).
 */
export const publishExam = asyncHandler(async (req, res) => {
  const examId = parseInt(req.params.id, 10);
  const result = await examService.publishExam(req.user.academyId, req.user, examId);
  return sendSuccess(res, result);
});

/**
 * 7b. POST /api/v1/exams/:id/unpublish
 * Unpublish exam results (Owner only).
 */
export const unpublishExam = asyncHandler(async (req, res) => {
  const examId = parseInt(req.params.id, 10);
  const result = await examService.unpublishExam(req.user.academyId, req.user, examId);
  return sendSuccess(res, result);
});

/**
 * 8. GET /api/v1/exams/:id/results
 * Class result sheet with dense ranks and subject score breakdowns.
 */
export const getExamResults = asyncHandler(async (req, res) => {
  const examId = parseInt(req.params.id, 10);
  const result = await examService.getExamResults(req.user.academyId, req.user, examId);
  return sendSuccess(res, result);
});

/**
 * 9. GET /api/v1/exams/:id/report-card/:studentId
 * Printable student report card with historical progress and teacher remarks.
 */
export const getReportCard = asyncHandler(async (req, res) => {
  const examId = parseInt(req.params.id, 10);
  const studentId = parseInt(req.params.studentId, 10);
  const result = await examService.getReportCard(req.user.academyId, req.user, examId, studentId);
  return sendSuccess(res, result);
});

/**
 * 10. PUT /api/v1/exams/:id/remarks/:studentId
 * Save or update teacher remarks on a student's report card.
 */
export const saveReportRemark = asyncHandler(async (req, res) => {
  const examId = parseInt(req.params.id, 10);
  const studentId = parseInt(req.params.studentId, 10);
  const result = await examService.saveReportRemark(
    req.user.academyId,
    req.user,
    examId,
    studentId,
    req.body.remark
  );
  return sendSuccess(res, result);
});

/**
 * 11. GET /api/v1/exams/:id/results/export
 * Download CSV of class examination results.
 */
export const exportResultsCsv = asyncHandler(async (req, res) => {
  const examId = parseInt(req.params.id, 10);
  const { csv, filename } = await examService.exportResultsCsv(req.user.academyId, req.user, examId);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  return res.status(200).send(csv);
});

/**
 * 12. GET /api/v1/exams/student/:studentId/results
 * View all published exam results for a specific student.
 */
export const getStudentResults = asyncHandler(async (req, res) => {
  const studentId = parseInt(req.params.studentId, 10);
  const result = await examService.getStudentPublishedResults(req.user.academyId, req.user, studentId);
  return sendSuccess(res, result);
});

export default {
  getExams,
  createExam,
  getExamDetails,
  updateExam,
  deleteExam,
  getExamSubjectMarks,
  saveExamMarks,
  publishExam,
  unpublishExam,
  getExamResults,
  getReportCard,
  saveReportRemark,
  exportResultsCsv,
  getStudentResults,
};
