import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { roleGuard } from "../middleware/roleGuard.js";
import { validate } from "../middleware/validate.js";
import noticeController from "../controllers/notice.controller.js";
import {
  createNoticeRouteSchema,
  updateNoticeRouteSchema,
  getNoticesRouteSchema,
  getNoticeIdRouteSchema,
  pinNoticeRouteSchema,
} from "../validators/notice.validator.js";

const router = Router();

// Protect all notice routes: owner, staff, and teacher
router.use(authenticate, roleGuard("owner", "staff", "teacher"));

// 1. GET /api/v1/notices (filters: audience, classId, page, limit)
router.get("/", validate(getNoticesRouteSchema), noticeController.getNotices);

// 2. GET /api/v1/notices/:id (includes read count)
router.get("/:id", validate(getNoticeIdRouteSchema), noticeController.getNoticeById);

// 3. POST /api/v1/notices (create notice)
router.post("/", validate(createNoticeRouteSchema), noticeController.createNotice);

// 4. PUT /api/v1/notices/:id (update notice)
router.put("/:id", validate(updateNoticeRouteSchema), noticeController.updateNotice);

// 5. DELETE /api/v1/notices/:id (delete notice)
router.delete("/:id", validate(getNoticeIdRouteSchema), noticeController.deleteNotice);

// 6. PATCH /api/v1/notices/:id/pin (toggle or set pin)
router.patch("/:id/pin", validate(pinNoticeRouteSchema), noticeController.togglePin);

export default router;

