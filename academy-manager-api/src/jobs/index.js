import cron from "node-cron";
import env from "../config/env.js";
import logger from "../utils/logger.js";
import ApiError from "../utils/ApiError.js";

import generateMonthlyFeesJob, { runGenerateMonthlyFees } from "./generateMonthlyFees.job.js";
import markOverdueFeesJob, { runMarkOverdueFees } from "./markOverdueFees.job.js";
import dueSoonRemindersJob, { runDueSoonReminders } from "./dueSoonReminders.job.js";
import cleanupJob, { runCleanup } from "./cleanup.job.js";

const JOBS_REGISTRY = {
  generateMonthlyFees: {
    cronTime: generateMonthlyFeesJob.cronTime,
    run: runGenerateMonthlyFees,
    description: "Generates monthly fee invoices for active students on the 1st of each month.",
  },
  markOverdueFees: {
    cronTime: markOverdueFeesJob.cronTime,
    run: runMarkOverdueFees,
    description: "Applies late fees and marks past-due fee invoices as overdue daily at 01:00.",
  },
  dueSoonReminders: {
    cronTime: dueSoonRemindersJob.cronTime,
    run: runDueSoonReminders,
    description: "Queues reminders for fees due in next 3 days daily at 09:00.",
  },
  cleanup: {
    cronTime: cleanupJob.cronTime,
    run: runCleanup,
    description: "Weekly cleanup of expired refresh tokens and reset tokens every Sunday at 03:00.",
  },
};

/**
 * Initializes and schedules background cron tasks.
 * Controlled by the ENABLE_CRON environment variable to prevent duplicate execution across cluster instances.
 */
export function initJobs() {
  const isEnabled = String(process.env.ENABLE_CRON || env.ENABLE_CRON).toLowerCase() === "true";

  if (!isEnabled) {
    logger.info("[CRON] Scheduled background jobs disabled (ENABLE_CRON is not 'true').");
    return;
  }

  logger.info("[CRON] Initializing scheduled jobs with timezone 'Asia/Karachi'...");

  for (const [name, jobConfig] of Object.entries(JOBS_REGISTRY)) {
    cron.schedule(
      jobConfig.cronTime,
      async () => {
        logger.info(`[CRON] Triggering scheduled execution for job '${name}'...`);
        try {
          await jobConfig.run();
        } catch (err) {
          logger.error(`[CRON] Execution failed for scheduled job '${name}': ${err.message}`);
        }
      },
      {
        timezone: "Asia/Karachi",
      }
    );
    logger.info(`[CRON] Scheduled '${name}' (${jobConfig.cronTime}) [Asia/Karachi]`);
  }
}

/**
 * Triggers a registered cron job on-demand (used by development / manual admin endpoints).
 *
 * @param {string} jobName
 * @param {number|null} targetAcademyId
 * @returns {Promise<object>}
 */
export async function runJobManually(jobName, targetAcademyId = null) {
  const job = JOBS_REGISTRY[jobName];
  if (!job) {
    throw ApiError.badRequest(
      `Job '${jobName}' not recognized. Available jobs: ${Object.keys(JOBS_REGISTRY).join(", ")}`
    );
  }

  logger.info(`[CRON MANUAL] Triggering '${jobName}' on-demand (Academy: ${targetAcademyId || "All"})...`);
  const result = await job.run(targetAcademyId);
  return {
    success: true,
    message: `Job '${jobName}' executed successfully.`,
    details: result,
  };
}

/**
 * Returns available job descriptors.
 */
export function getAvailableJobs() {
  return Object.entries(JOBS_REGISTRY).map(([name, config]) => ({
    name,
    cronTime: config.cronTime,
    description: config.description,
  }));
}

export default {
  initJobs,
  runJobManually,
  getAvailableJobs,
};
