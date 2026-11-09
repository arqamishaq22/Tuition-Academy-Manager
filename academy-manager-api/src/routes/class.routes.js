import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { roleGuard } from "../middleware/roleGuard.js";
import { validate } from "../middleware/validate.js";
import {
  createClassSchema,
  updateClassSchema,
  assignSubjectSchema,
  createSubjectSchema,
} from "../validators/class.validator.js";
import classController from "../controllers/class.controller.js";

const router = Router();

// Require authentication for all class routes
router.use(authenticate);

// 1. Academy Subjects (Placed before /:id)
router.get(
  "/subjects",
  roleGuard("owner", "staff", "teacher"),
  classController.getSubjects
);
router.post(
  "/subjects",
  roleGuard("owner", "staff"),
  validate(createSubjectSchema),
  classController.createSubject
);

// 2. List all classes (Teacher has scoped read-only access)
router.get(
  "/",
  roleGuard("owner", "staff", "teacher"),
  classController.getAllClasses
);

// 3. Get single class details
router.get(
  "/:id",
  roleGuard("owner", "staff", "teacher"),
  classController.getClassById
);

// 4. Create class
router.post(
  "/",
  roleGuard("owner", "staff"),
  validate(createClassSchema),
  classController.createClass
);

// 5. Update class (PUT & PATCH)
router.put(
  "/:id",
  roleGuard("owner", "staff"),
  validate(updateClassSchema),
  classController.updateClass
);
router.patch(
  "/:id",
  roleGuard("owner", "staff"),
  validate(updateClassSchema),
  classController.updateClass
);

// 6. Delete / Archive class
router.delete(
  "/:id",
  roleGuard("owner", "staff"),
  classController.deleteClass
);

// 7. Assign subject & teacher to class
router.post(
  "/:id/subjects",
  roleGuard("owner", "staff"),
  validate(assignSubjectSchema),
  classController.assignSubject
);

// 8. Remove subject from class
router.delete(
  "/:id/subjects/:subjectId",
  roleGuard("owner", "staff"),
  classController.removeSubject
);

export default router;
