import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { registerSchema, loginSchema, refreshTokenSchema } from "../validators/auth.validator.js";
import authController from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.post("/register", validate(registerSchema), authController.register);
router.post("/login", validate(loginSchema), authController.login);
router.post("/refresh", validate(refreshTokenSchema), authController.refreshToken);
router.get("/me", authenticate, authController.getProfile);
router.post("/logout", authController.logout);

export default router;

