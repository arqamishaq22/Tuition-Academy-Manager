import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";
import authService from "../services/auth.service.js";
import env from "../config/env.js";

/**
 * Helper to set HttpOnly Refresh Token Cookie according to requirements:
 * httpOnly: true, sameSite: 'lax', secure: env.COOKIE_SECURE, path: '/api/v1/auth', maxAge: 7 days.
 */
function setRefreshCookie(res, refreshToken) {
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: "lax",
    path: "/api/v1/auth",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  });
}

function clearRefreshCookie(res) {
  res.clearCookie("refreshToken", {
    path: "/api/v1/auth",
  });
}

export const signup = asyncHandler(async (req, res) => {
  const userAgent = req.headers["user-agent"] || null;
  const ip = req.ip || req.connection.remoteAddress || null;

  const result = await authService.signup(req.body, userAgent, ip);
  setRefreshCookie(res, result.refreshToken);

  return sendSuccess(
    res,
    {
      user: result.user,
      academy: result.academy,
      accessToken: result.accessToken,
    },
    null,
    201
  );
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const userAgent = req.headers["user-agent"] || null;
  const ip = req.ip || req.connection.remoteAddress || null;

  const result = await authService.login(email, password, userAgent, ip);
  setRefreshCookie(res, result.refreshToken);

  return sendSuccess(res, {
    user: result.user,
    academy: result.academy,
    accessToken: result.accessToken,
  });
});

export const parentLogin = asyncHandler(async (req, res) => {
  const { phone, password } = req.body;
  const userAgent = req.headers["user-agent"] || null;
  const ip = req.ip || req.connection.remoteAddress || null;

  const result = await authService.parentLogin(phone, password, userAgent, ip);
  setRefreshCookie(res, result.refreshToken);

  return sendSuccess(res, {
    user: result.user,
    academy: result.academy,
    accessToken: result.accessToken,
  });
});

export const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;
  const userAgent = req.headers["user-agent"] || null;
  const ip = req.ip || req.connection.remoteAddress || null;

  const result = await authService.refresh(token, userAgent, ip);
  setRefreshCookie(res, result.refreshToken);

  return sendSuccess(res, {
    accessToken: result.accessToken,
  });
});

export const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;
  const result = await authService.logout(token, req.user?.id, req.user?.academyId);
  clearRefreshCookie(res);

  return sendSuccess(res, result);
});

export const logoutAll = asyncHandler(async (req, res) => {
  const result = await authService.logoutAll(req.user.id, req.user.academyId);
  clearRefreshCookie(res);

  return sendSuccess(res, result);
});

export const getMe = asyncHandler(async (req, res) => {
  const result = await authService.getMe(req.user.id, req.user.academyId);
  return sendSuccess(res, result);
});

export const updateProfile = asyncHandler(async (req, res) => {
  const result = await authService.updateProfile(req.user.id, req.user.academyId, req.body);
  return sendSuccess(res, result);
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const result = await authService.changePassword(
    req.user.id,
    req.user.academyId,
    currentPassword,
    newPassword
  );
  return sendSuccess(res, result);
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.forgotPassword(req.body.email);
  return sendSuccess(res, result);
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, email, newPassword } = req.body;
  const result = await authService.resetPassword(token, email, newPassword);
  clearRefreshCookie(res);

  return sendSuccess(res, result);
});

export default {
  signup,
  login,
  parentLogin,
  refreshToken,
  logout,
  logoutAll,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
};
