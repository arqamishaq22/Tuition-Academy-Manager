import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";
import { getPagination } from "../utils/pagination.js";
import classService from "../services/class.service.js";

export const getAllClasses = asyncHandler(async (req, res) => {
  const { page, limit, offset, formatMeta } = getPagination(req, 10);
  const { q } = req.query;

  const { classes, total } = await classService.getAllClasses(
    req.user.academyId,
    { q, limit, offset },
    req.user
  );

  return sendSuccess(res, classes, formatMeta(total));
});

export const getClassById = asyncHandler(async (req, res) => {
  const cls = await classService.getClassById(
    req.user.academyId,
    req.params.id,
    req.user
  );
  return sendSuccess(res, cls);
});

export const createClass = asyncHandler(async (req, res) => {
  const cls = await classService.createClass(
    req.user.academyId,
    req.body,
    req.user.id
  );
  return sendSuccess(res, cls, null, 201);
});

export const updateClass = asyncHandler(async (req, res) => {
  const updated = await classService.updateClass(
    req.user.academyId,
    req.params.id,
    req.body,
    req.user.id
  );
  return sendSuccess(res, updated);
});

export const deleteClass = asyncHandler(async (req, res) => {
  const force = req.query.force === "true";
  const result = await classService.deleteClass(
    req.user.academyId,
    req.params.id,
    force,
    req.user.id
  );
  return sendSuccess(res, result);
});

export const assignSubject = asyncHandler(async (req, res) => {
  const { subjectId, teacherId } = req.body;
  const result = await classService.assignSubject(
    req.user.academyId,
    req.params.id,
    subjectId,
    teacherId,
    req.user.id
  );
  return sendSuccess(res, result);
});

export const removeSubject = asyncHandler(async (req, res) => {
  const result = await classService.removeSubject(
    req.user.academyId,
    req.params.id,
    req.params.subjectId,
    req.user.id
  );
  return sendSuccess(res, result);
});

export const getSubjects = asyncHandler(async (req, res) => {
  const subjects = await classService.getAcademySubjects(req.user.academyId);
  return sendSuccess(res, subjects);
});

export const createSubject = asyncHandler(async (req, res) => {
  const subject = await classService.createAcademySubject(
    req.user.academyId,
    req.body.name,
    req.user.id
  );
  return sendSuccess(res, subject, null, 201);
});

export default {
  getAllClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
  assignSubject,
  removeSubject,
  getSubjects,
  createSubject,
};
