import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";
import noticeService from "../services/notice.service.js";

/**
 * 1. GET /api/v1/notices
 * List notices with audience/class filters and pagination.
 */
export const getNotices = asyncHandler(async (req, res) => {
  const result = await noticeService.getNoticesList(
    req.user.academyId,
    req.query,
    req.user
  );
  return sendSuccess(res, result.notices, {
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: result.totalPages,
  });
});

/**
 * 2. GET /api/v1/notices/:id
 * Notice detail with reader count and reader list.
 */
export const getNoticeById = asyncHandler(async (req, res) => {
  const result = await noticeService.getNoticeById(
    req.user.academyId,
    req.params.id,
    req.user
  );
  return sendSuccess(res, result);
});

/**
 * 3. POST /api/v1/notices
 * Create a new notice.
 */
export const createNotice = asyncHandler(async (req, res) => {
  const result = await noticeService.createNotice(
    req.user.academyId,
    req.body,
    req.user
  );
  return sendSuccess(res, result, null, 201);
});

/**
 * 4. PUT /api/v1/notices/:id
 * Edit notice details.
 */
export const updateNotice = asyncHandler(async (req, res) => {
  const result = await noticeService.updateNotice(
    req.user.academyId,
    req.params.id,
    req.body,
    req.user
  );
  return sendSuccess(res, result);
});

/**
 * 5. DELETE /api/v1/notices/:id
 * Delete notice.
 */
export const deleteNotice = asyncHandler(async (req, res) => {
  const result = await noticeService.deleteNotice(
    req.user.academyId,
    req.params.id,
    req.user
  );
  return sendSuccess(res, result);
});

/**
 * 6. PATCH /api/v1/notices/:id/pin
 * Toggle or set pinned status.
 */
export const togglePin = asyncHandler(async (req, res) => {
  const result = await noticeService.togglePinNotice(
    req.user.academyId,
    req.params.id,
    req.user,
    req.body?.isPinned
  );
  return sendSuccess(res, result);
});

export default {
  getNotices,
  getNoticeById,
  createNotice,
  updateNotice,
  deleteNotice,
  togglePin,
};

