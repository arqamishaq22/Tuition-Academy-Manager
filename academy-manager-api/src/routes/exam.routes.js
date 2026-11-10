import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { roleGuard } from "../middleware/roleGuard.js";
import { validate } from "../middleware/validate.js";
import {
  createExamRouteSchema,
  updateExamRouteSchema,
  deleteExamRouteSchema,
  getExamDetailsRouteSchema,
  getMarksRouteSchema,
  saveMarksRouteSchema,
  publishExamRouteSchema,
  getResultsRouteSchema,
  getReportCardRouteSchema,
  saveRemarkRouteSchema,
  studentResultsRouteSchema,
  listExamsQuerySchema,
} from "../validators/exam.validator.js";
import examController from "../controllers/exam.controller.js";

const router = Router();

// Authentication required for all examination endpoints
router.use(authenticate);

// 1. GET /student/:studentId/results - All published exam results for a student
router.get(
  "/student/:studentId/results",
  roleGuard("owner", "staff", "teacher", "parent"),
  validate(studentResultsRouteSchema),
  examController.getStudentResults
);

// 2. GET & POST /:id/marks - View roster and bulk record marks for an exam subject
router.get(
  "/:id/marks",
  roleGuard("owner", "staff", "teacher"),
  validate(getMarksRouteSchema),
  examController.getExamSubjectMarks
);

router.post(
  "/:id/marks",
  roleGuard("owner", "staff", "teacher"),
  validate(saveMarksRouteSchema),
  examController.saveExamMarks
);

// 3. POST /:id/publish - Publish exam results (checks completion)
router.post(
  "/:id/publish",
  roleGuard("owner", "staff", "teacher"),
  validate(publishExamRouteSchema),
  examController.publishExam
);

// 4. POST /:id/unpublish - Unpublish exam results (Owner only)
router.post(
  "/:id/unpublish",
  roleGuard("owner"),
  validate(publishExamRouteSchema),
  examController.unpublishExam
);

// 5. GET /:id/results/export - CSV export of the class result sheet
router.get(
  "/:id/results/export",
  roleGuard("owner", "staff", "teacher"),
  validate(getResultsRouteSchema),
  examController.exportResultsCsv
);

// 6. GET /:id/results - Full class result sheet with dense ranks
router.get(
  "/:id/results",
  roleGuard("owner", "staff", "teacher", "parent"),
  validate(getResultsRouteSchema),
  examController.getExamResults
);

// 7. GET /:id/report-card/:studentId - Comprehensive student report card
router.get(
  "/:id/report-card/:studentId",
  roleGuard("owner", "staff", "teacher", "parent"),
  validate(getReportCardRouteSchema),
  examController.getReportCard
);

// 8. PUT /:id/remarks/:studentId - Save teacher remark on student report card
router.put(
  "/:id/remarks/:studentId",
  roleGuard("owner", "staff", "teacher"),
  validate(saveRemarkRouteSchema),
  examController.saveReportRemark
);

// 9. GET /:id - Exam header, subject allocations, and performance summary
router.get(
  "/:id",
  roleGuard("owner", "staff", "teacher", "parent"),
  validate(getExamDetailsRouteSchema),
  examController.getExamDetails
);

// 10. PUT /:id - Update exam header
router.put(
  "/:id",
  roleGuard("owner", "staff", "teacher"),
  validate(updateExamRouteSchema),
  examController.updateExam
);

// 11. DELETE /:id - Delete exam (?force=true allowed for owner if marks exist)
router.delete(
  "/:id",
  roleGuard("owner", "staff", "teacher"),
  validate(deleteExamRouteSchema),
  examController.deleteExam
);

// 12. GET / - List exams with filters and progress
router.get(
  "/",
  roleGuard("owner", "staff", "teacher", "parent"),
  validate(listExamsQuerySchema),
  examController.getExams
);

// 13. POST / - Create exam with assigned subjects
router.post(
  "/",
  roleGuard("owner", "staff", "teacher"),
  validate(createExamRouteSchema),
  examController.createExam
);

export default router;

