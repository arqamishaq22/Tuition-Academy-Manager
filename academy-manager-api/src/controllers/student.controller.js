import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";
import { getPagination } from "../utils/pagination.js";
import ApiError from "../utils/ApiError.js";
import studentService from "../services/student.service.js";

export const getAllStudents = asyncHandler(async (req, res) => {
  const { page, limit, offset, formatMeta } = getPagination(req, 10);
  const { q, classId, status, feeStatus, sortBy, order } = req.query;

  const { students, total } = await studentService.getAllStudents(
    req.user.academyId,
    {
      q,
      classId,
      status,
      feeStatus,
      sortBy,
      order,
      limit,
      offset,
    },
    req.user
  );

  return sendSuccess(res, students, formatMeta(total));
});

export const getStudentById = asyncHandler(async (req, res) => {
  const student = await studentService.getStudentById(
    req.user.academyId,
    req.params.id,
    req.user
  );
  return sendSuccess(res, student);
});

export const createStudent = asyncHandler(async (req, res) => {
  const student = await studentService.createStudent(
    req.user.academyId,
    req.body,
    req.user.id
  );
  return sendSuccess(res, student, null, 201);
});

export const updateStudent = asyncHandler(async (req, res) => {
  const updated = await studentService.updateStudent(
    req.user.academyId,
    req.params.id,
    req.body,
    req.user.id
  );
  return sendSuccess(res, updated);
});

export const deleteStudent = asyncHandler(async (req, res) => {
  const result = await studentService.deleteStudent(
    req.user.academyId,
    req.params.id,
    req.user.id
  );
  return sendSuccess(res, result);
});

export const bulkImport = asyncHandler(async (req, res) => {
  if (!req.file || !req.file.buffer) {
    throw ApiError.badRequest("Please upload a CSV file with the key 'file'.");
  }

  const report = await studentService.bulkImportStudents(
    req.user.academyId,
    req.file.buffer,
    req.user.id
  );

  return sendSuccess(res, report, null, 200);
});

export const exportStudents = asyncHandler(async (req, res) => {
  const csvData = await studentService.exportStudentsCsv(req.user.academyId);
  const filename = `students-${new Date().toISOString().slice(0, 10)}.csv`;

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  return res.status(200).send(csvData);
});

export const uploadPhoto = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw ApiError.badRequest("Please select a JPG or PNG photo file to upload.");
  }

  const result = await studentService.updateStudentPhoto(
    req.user.academyId,
    req.params.id,
    req.file.filename,
    req.user.id
  );

  return sendSuccess(res, result);
});

export const promoteStudent = asyncHandler(async (req, res) => {
  const result = await studentService.promoteStudent(
    req.user.academyId,
    req.params.id,
    req.body.targetClassId,
    req.user.id
  );
  return sendSuccess(res, result);
});

export const promoteClass = asyncHandler(async (req, res) => {
  const result = await studentService.promoteClass(
    req.user.academyId,
    req.body.currentClassId,
    req.body.targetClassId,
    req.user.id
  );
  return sendSuccess(res, result);
});

export default {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  bulkImport,
  exportStudents,
  uploadPhoto,
  promoteStudent,
  promoteClass,
};
