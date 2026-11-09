import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { roleGuard } from "../middleware/roleGuard.js";
import { validate } from "../middleware/validate.js";
import { createStudentSchema, updateStudentSchema } from "../validators/student.validator.js";
import studentController from "../controllers/student.controller.js";

const router = Router();

// Protect all student routes
router.use(authenticate);

router.get("/", studentController.getAllStudents);
router.get("/:id", studentController.getStudentById);
router.post(
  "/",
  roleGuard("admin", "owner", "staff"),
  validate(createStudentSchema),
  studentController.createStudent
);
router.put(
  "/:id",
  roleGuard("admin", "owner", "staff"),
  validate(updateStudentSchema),
  studentController.updateStudent
);
router.delete("/:id", roleGuard("admin", "owner"), studentController.deleteStudent);

export default router;
