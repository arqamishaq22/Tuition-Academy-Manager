import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { roleGuard } from "../middleware/roleGuard.js";
import { validate } from "../middleware/validate.js";
import { uploadCsv, uploadStudentPhoto } from "../middleware/upload.js";
import {
  createStudentSchema,
  updateStudentSchema,
  promoteStudentSchema,
  promoteClassSchema,
} from "../validators/student.validator.js";
import studentController from "../controllers/student.controller.js";

const router = Router();

// Require authentication for all student routes
router.use(authenticate);

// 1. Export students as CSV (Placed before /:id)
router.get(
  "/export",
  roleGuard("owner", "staff"),
  studentController.exportStudents
);

// 2. Bulk Import via CSV upload
router.post(
  "/bulk-import",
  roleGuard("owner", "staff"),
  uploadCsv.single("file"),
  studentController.bulkImport
);

// 3. Promote whole class to next class
router.post(
  "/promote-class",
  roleGuard("owner", "staff"),
  validate(promoteClassSchema),
  studentController.promoteClass
);

// 4. List all students (Teacher has scoped read-only access)
router.get(
  "/",
  roleGuard("owner", "staff", "teacher"),
  studentController.getAllStudents
);

// 5. Get single student details (Teacher has scoped read-only access)
router.get(
  "/:id",
  roleGuard("owner", "staff", "teacher"),
  studentController.getStudentById
);

// 6. Create student
router.post(
  "/",
  roleGuard("owner", "staff"),
  validate(createStudentSchema),
  studentController.createStudent
);

// 7. Update student (PUT & PATCH)
router.put(
  "/:id",
  roleGuard("owner", "staff"),
  validate(updateStudentSchema),
  studentController.updateStudent
);
router.patch(
  "/:id",
  roleGuard("owner", "staff"),
  validate(updateStudentSchema),
  studentController.updateStudent
);

// 8. Soft Delete student
router.delete(
  "/:id",
  roleGuard("owner", "staff"),
  studentController.deleteStudent
);

// 9. Upload student photo (max 2MB, JPG/PNG)
router.post(
  "/:id/photo",
  roleGuard("owner", "staff"),
  uploadStudentPhoto.single("photo"),
  studentController.uploadPhoto
);

// 10. Promote individual student
router.post(
  "/:id/promote",
  roleGuard("owner", "staff"),
  validate(promoteStudentSchema),
  studentController.promoteStudent
);

export default router;
