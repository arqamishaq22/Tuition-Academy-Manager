import { query } from "../config/db.js";
import feeService from "../services/fee.service.js";
import { getCurrentYearMonthKarachi } from "../utils/attendance.js";
import logger from "../utils/logger.js";

/**
 * Job 1: Monthly Fee Invoicing
 * Runs 1st day of every month at 00:30 (Asia/Karachi).
 * Cron: '30 0 1 * *'
 *
 * Automatically generates monthly fee records for active students across all active academies.
 * Safe to re-run (idempotent; skips existing invoices).
 */
export async function runGenerateMonthlyFees(targetAcademyId = null) {
  const startTime = Date.now();
  const { month, year } = getCurrentYearMonthKarachi();
  logger.info(`[CRON] Starting generateMonthlyFees for period ${year}-${String(month).padStart(2, "0")}...`);

  let sql = `SELECT id, name FROM academies WHERE is_active = TRUE`;
  const params = {};
  if (targetAcademyId) {
    sql += ` AND id = :targetAcademyId`;
    params.targetAcademyId = Number(targetAcademyId);
  }

  const academies = await query(sql, params);

  let grandCreated = 0;
  let grandSkipped = 0;

  for (const academy of academies) {
    try {
      const res = await feeService.generateMonthlyFees(academy.id, { month, year });
      grandCreated += res.created;
      grandSkipped += res.skipped;
      logger.info(
        `[CRON] Academy '${academy.name}' (ID ${academy.id}): Created ${res.created}, Skipped ${res.skipped}`
      );
    } catch (err) {
      logger.error(`[CRON] Error generating fees for academy ${academy.id} (${academy.name}): ${err.message}`);
    }
  }

  const durationMs = Date.now() - startTime;
  logger.info(
    `[CRON] Completed generateMonthlyFees: ${grandCreated} created, ${grandSkipped} skipped across ${academies.length} academies in ${durationMs}ms.`
  );

  return {
    job: "generateMonthlyFees",
    month,
    year,
    academiesProcessed: academies.length,
    grandCreated,
    grandSkipped,
    durationMs,
  };
}

export default {
  cronTime: "30 0 1 * *",
  run: runGenerateMonthlyFees,
};
