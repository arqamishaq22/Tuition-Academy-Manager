import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { roleGuard } from "../middleware/roleGuard.js";
import { validate } from "../middleware/validate.js";
import {
  createTeacherSchema,
  updateTeacherSchema,
} from "../validators/teacher.validator.js";
import teacherController from "../controllers/teacher.controller.js";

const router = Router();

// Protect all teacher routes with authentication
router.use(authenticate);

// List all teachers (owner & staff only)
router.get(
  "/",
  roleGuard("owner", "staff"),
  teacherController.getAllTeachers
);

// Get single teacher details
router.get(
  "/:id",
  roleGuard("owner", "staff"),
  teacherController.getTeacherById
);

// Create teacher (with optional user login account)
router.post(
  "/",
  roleGuard("owner", "staff"),
  validate(createTeacherSchema),
  teacherController.createTeacher
);

// Update teacher (PUT & PATCH)
router.put(
  "/:id",
  roleGuard("owner", "staff"),
  validate(updateTeacherSchema),
  teacherController.updateTeacher
);
router.patch(
  "/:id",
  roleGuard("owner", "staff"),
  validate(updateTeacherSchema),
  teacherController.updateTeacher
);

// Delete / Deactivate teacher
router.delete(
  "/:id",
  roleGuard("owner", "staff"),
  teacherController.deleteTeacher
);

export default router;

