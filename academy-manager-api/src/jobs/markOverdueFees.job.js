import feeService from "../services/fee.service.js";
import logger from "../utils/logger.js";

/**
 * Job 2: Mark Overdue Fees & Apply Late Surcharges
 * Runs every day at 01:00 (Asia/Karachi).
 * Cron: '0 1 * * *'
 *
 * Scans for invoices past due date, marks status as 'overdue', and applies
 * academy late fee amount if late fees are enabled and not already applied.
 * Safe to re-run.
 */
export async function runMarkOverdueFees(targetAcademyId = null) {
  const startTime = Date.now();
  logger.info(`[CRON] Starting markOverdueFees job...`);

  try {
    const result = await feeService.markOverdueAndApplyLateFees(targetAcademyId);
    const durationMs = Date.now() - startTime;
    logger.info(
      `[CRON] Completed markOverdueFees: ${result.updatedCount} invoices updated in ${durationMs}ms.`
    );

    return {
      job: "markOverdueFees",
      updatedCount: result.updatedCount,
      durationMs,
    };
  } catch (err) {
    logger.error(`[CRON] Error during markOverdueFees job: ${err.message}`);
    throw err;
  }
}

export default {
  cronTime: "0 1 * * *",
  run: runMarkOverdueFees,
};
