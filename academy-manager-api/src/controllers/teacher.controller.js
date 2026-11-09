import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";
import { getPagination } from "../utils/pagination.js";
import teacherService from "../services/teacher.service.js";

export const getAllTeachers = asyncHandler(async (req, res) => {
  const { page, limit, offset, formatMeta } = getPagination(req, 10);
  const { q } = req.query;

  const { teachers, total } = await teacherService.getAllTeachers(
    req.user.academyId,
    { q, limit, offset }
  );

  return sendSuccess(res, teachers, formatMeta(total));
});

export const getTeacherById = asyncHandler(async (req, res) => {
  const teacher = await teacherService.getTeacherById(
    req.user.academyId,
    req.params.id
  );
  return sendSuccess(res, teacher);
});

export const createTeacher = asyncHandler(async (req, res) => {
  const teacher = await teacherService.createTeacher(
    req.user.academyId,
    req.body,
    req.user.id
  );
  return sendSuccess(res, teacher, null, 201);
});

export const updateTeacher = asyncHandler(async (req, res) => {
  const updated = await teacherService.updateTeacher(
    req.user.academyId,
    req.params.id,
    req.body,
    req.user.id
  );
  return sendSuccess(res, updated);
});

export const deleteTeacher = asyncHandler(async (req, res) => {
  const result = await teacherService.deleteTeacher(
    req.user.academyId,
    req.params.id,
    req.user.id
  );
  return sendSuccess(res, result);
});

export default {
  getAllTeachers,
  getTeacherById,
  createTeacher,
  updateTeacher,
  deleteTeacher,
};
