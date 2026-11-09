import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";
import authService from "../services/auth.service.js";
import env from "../config/env.js";

// Helper to set HttpOnly auth cookie
const setAuthCookie = (res, token) => {
  res.cookie("accessToken", token, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: "lax",
    maxAge: 15 * 60 * 1000, // 15 mins
  });
};

export const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  setAuthCookie(res, result.tokens.accessToken);
  return sendSuccess(res, result, null, 201);
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  setAuthCookie(res, result.tokens.accessToken);
  return sendSuccess(res, result);
});

export const refreshToken = asyncHandler(async (req, res) => {
  const token = req.body.refreshToken || req.cookies.refreshToken;
  const tokens = await authService.refresh(token);
  setAuthCookie(res, tokens.accessToken);
  return sendSuccess(res, { tokens });
});

export const getProfile = asyncHandler(async (req, res) => {
  return sendSuccess(res, { user: req.user });
});

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  return sendSuccess(res, { message: "Logged out successfully" });
});

export default {
  register,
  login,
  refreshToken,
  getProfile,
  logout,
};

