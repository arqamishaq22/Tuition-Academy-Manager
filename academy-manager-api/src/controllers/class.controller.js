import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";
import classService from "../services/class.service.js";

export const getAllClasses = asyncHandler(async (req, res) => {
  const classes = await classService.getAllClasses(req.user.academyId);
  return sendSuccess(res, classes);
});

export const getClassById = asyncHandler(async (req, res) => {
  const cls = await classService.getClassById(req.user.academyId, req.params.id);
  return sendSuccess(res, cls);
});

export const createClass = asyncHandler(async (req, res) => {
  const created = await classService.createClass(req.user.academyId, req.body);
  return sendSuccess(res, created, null, 201);
});

export const updateClass = asyncHandler(async (req, res) => {
  const updated = await classService.updateClass(req.user.academyId, req.params.id, req.body);
  return sendSuccess(res, updated);
});

export const deleteClass = asyncHandler(async (req, res) => {
  const result = await classService.deleteClass(req.user.academyId, req.params.id);
  return sendSuccess(res, result);
});

export default {
  getAllClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
};

