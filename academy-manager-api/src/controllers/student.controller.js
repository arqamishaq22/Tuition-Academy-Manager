import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";
import { getPagination } from "../utils/pagination.js";
import studentService from "../services/student.service.js";

export const getAllStudents = asyncHandler(async (req, res) => {
  const { page, limit, offset, formatMeta } = getPagination(req, 10);
  const { search, classId, feeStatus } = req.query;

  const { students, total } = await studentService.getAllStudents(req.user.academyId, {
    search,
    classId: classId ? parseInt(classId, 10) : undefined,
    feeStatus,
    limit,
    offset,
  });

  return sendSuccess(res, students, formatMeta(total));
});

export const getStudentById = asyncHandler(async (req, res) => {
  const student = await studentService.getStudentById(req.user.academyId, req.params.id);
  return sendSuccess(res, student);
});

export const createStudent = asyncHandler(async (req, res) => {
  const student = await studentService.createStudent(req.user.academyId, req.body);
  return sendSuccess(res, student, null, 201);
});

export const updateStudent = asyncHandler(async (req, res) => {
  const updated = await studentService.updateStudent(req.user.academyId, req.params.id, req.body);
  return sendSuccess(res, updated);
});

export const deleteStudent = asyncHandler(async (req, res) => {
  const result = await studentService.deleteStudent(req.user.academyId, req.params.id);
  return sendSuccess(res, result);
});

export default {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
};

