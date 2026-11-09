import { Router } from "express";
import rateLimit from "express-rate-limit";
import { validate } from "../middleware/validate.js";
import {
  signupSchema,
  loginSchema,
  parentLoginSchema,
  refreshTokenSchema,
  updateProfileSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../validators/auth.validator.js";
import authController from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

/**
 * Strict rate limiter for sensitive authentication endpoints:
 * 10 requests per 15 minutes per IP (safeguards against brute-force and credential stuffing).
 */
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts. Please try again after 15 minutes.",
    errors: [
      {
        message: "Rate limit exceeded. Maximum 10 attempts allowed per 15 minutes.",
      },
    ],
  },
});

// 1. POST /signup (and alias /register)
router.post(
  "/signup",
  authRateLimiter,
  validate(signupSchema),
  authController.signup
);
router.post(
  "/register",
  authRateLimiter,
  validate(signupSchema),
  authController.signup
);

// 2. POST /login
router.post(
  "/login",
  authRateLimiter,
  validate(loginSchema),
  authController.login
);

// 3. POST /parent-login
router.post(
  "/parent-login",
  authRateLimiter,
  validate(parentLoginSchema),
  authController.parentLogin
);

// 4. POST /refresh
router.post(
  "/refresh",
  validate(refreshTokenSchema),
  authController.refreshToken
);

// 5. POST /logout
router.post("/logout", authController.logout);

// 6. POST /logout-all (Requires Bearer access token)
router.post("/logout-all", authenticate, authController.logoutAll);

// 7. GET /me (Requires Bearer access token)
router.get("/me", authenticate, authController.getMe);

// 8. PATCH /me (Requires Bearer access token)
router.patch(
  "/me",
  authenticate,
  validate(updateProfileSchema),
  authController.updateProfile
);

// 9. POST /change-password (Requires Bearer access token)
router.post(
  "/change-password",
  authenticate,
  validate(changePasswordSchema),
  authController.changePassword
);

// 10. POST /forgot-password
router.post(
  "/forgot-password",
  authRateLimiter,
  validate(forgotPasswordSchema),
  authController.forgotPassword
);

// 11. POST /reset-password
router.post(
  "/reset-password",
  validate(resetPasswordSchema),
  authController.resetPassword
);

export default router;
