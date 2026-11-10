import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { roleGuard } from "../middleware/roleGuard.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";
import { runJobManually, getAvailableJobs } from "../jobs/index.js";
import env from "../config/env.js";
import ApiError from "../utils/ApiError.js";

const router = Router();

// Protect all admin job endpoints: Owner role only
router.use(authenticate, roleGuard("owner"));

/**
 * GET /api/v1/admin/jobs
 * Lists available background jobs.
 */
router.get(
  "/jobs",
  asyncHandler(async (req, res) => {
    const jobs = getAvailableJobs();
    return sendSuccess(res, jobs);
  })
);

/**
 * POST /api/v1/admin/jobs/:name/run
 * Trigger a background job on demand for testing/verification.
 */
router.post(
  "/jobs/:name/run",
  asyncHandler(async (req, res) => {
    // Block in production if requested, or allow owner to trigger
    if (env.NODE_ENV === "production" && process.env.ALLOW_PROD_JOB_TRIGGER !== "true") {
      throw ApiError.forbidden("Manual job execution is disabled in production environment.");
    }

    const { name } = req.params;
    const result = await runJobManually(name, req.user.academyId);
    return sendSuccess(res, result);
  })
);

export default router;
