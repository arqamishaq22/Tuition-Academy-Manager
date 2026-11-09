import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { roleGuard } from "../middleware/roleGuard.js";
import { validate } from "../middleware/validate.js";
import { createExamSchema, saveMarksSchema } from "../validators/result.validator.js";
import resultController from "../controllers/result.controller.js";

const router = Router();

router.use(authenticate);

router.get("/exams", resultController.getExams);
router.post(
  "/exams",
  roleGuard("admin", "owner", "teacher"),
  validate(createExamSchema),
  resultController.createExam
);
router.post(
  "/marks",
  roleGuard("admin", "owner", "teacher"),
  validate(saveMarksSchema),
  resultController.saveMarks
);
router.get("/report-card/:studentId", resultController.getReportCard);

export default router;

