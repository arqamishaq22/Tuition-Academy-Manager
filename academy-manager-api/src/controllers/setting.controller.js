import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";
import ApiError from "../utils/ApiError.js";
import settingService from "../services/setting.service.js";

/**
 * 1. GET /api/v1/settings
 * Academy profile, fee settings, notifications, and plan details.
 */
export const getSettings = asyncHandler(async (req, res) => {
  const result = await settingService.getAcademySettings(req.user.academyId);
  return sendSuccess(res, result);
});

/**
 * 2. PUT /api/v1/settings/profile
 * Update academy contact and location details.
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const result = await settingService.updateProfile(req.user.academyId, req.body);
  return sendSuccess(res, result);
});

/**
 * 3. POST /api/v1/settings/logo
 * Upload and set academy logo.
 */
export const uploadLogo = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw ApiError.badRequest("Please select an image file to upload as the academy logo.");
  }

  const logoUrl = `/uploads/logos/${req.file.filename}`;
  const result = await settingService.updateLogo(req.user.academyId, logoUrl);
  return sendSuccess(res, result);
});

/**
 * 4. PUT /api/v1/settings/fees
 * Update fee due day, late fee, and reminder message template.
 */
export const updateFeeSettings = asyncHandler(async (req, res) => {
  const result = await settingService.updateFeeSettings(req.user.academyId, req.body);
  return sendSuccess(res, result);
});

/**
 * 5. PUT /api/v1/settings/notifications
 * Update automated alert and report settings.
 */
export const updateNotificationSettings = asyncHandler(async (req, res) => {
  const result = await settingService.updateNotificationSettings(req.user.academyId, req.body);
  return sendSuccess(res, result);
});

/**
 * 6. GET /api/v1/settings/team
 * List all staff and teachers of the academy.
 */
export const getTeam = asyncHandler(async (req, res) => {
  const result = await settingService.getTeamList(req.user.academyId);
  return sendSuccess(res, result);
});

/**
 * 7. POST /api/v1/settings/team/invite
 * Invite a new teacher or staff member.
 */
export const inviteTeamMember = asyncHandler(async (req, res) => {
  const result = await settingService.inviteTeamMember(
    req.user.academyId,
    req.body,
    req.user.id
  );
  return sendSuccess(res, result, null, 201);
});

/**
 * 8. PATCH /api/v1/settings/team/:userId
 * Change role or active status of a team member.
 */
export const updateTeamMember = asyncHandler(async (req, res) => {
  const result = await settingService.updateTeamMember(
    req.user.academyId,
    req.params.userId,
    req.body,
    req.user.id
  );
  return sendSuccess(res, result);
});

/**
 * 9. DELETE /api/v1/settings/team/:userId
 * Remove a team member (prevented for last owner).
 */
export const deleteTeamMember = asyncHandler(async (req, res) => {
  const result = await settingService.deleteTeamMember(
    req.user.academyId,
    req.params.userId,
    req.user.id
  );
  return sendSuccess(res, result);
});

/**
 * 10. GET /api/v1/settings/plan
 * Current subscription plan and student limit usage.
 */
export const getPlan = asyncHandler(async (req, res) => {
  const result = await settingService.getPlanDetails(req.user.academyId);
  return sendSuccess(res, result);
});

export default {
  getSettings,
  updateProfile,
  uploadLogo,
  updateFeeSettings,
  updateNotificationSettings,
  getTeam,
  inviteTeamMember,
  updateTeamMember,
  deleteTeamMember,
  getPlan,
};
