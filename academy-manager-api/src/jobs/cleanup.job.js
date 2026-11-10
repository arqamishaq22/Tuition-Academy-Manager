import { query } from "../config/db.js";
import logger from "../utils/logger.js";

/**
 * Job 4: Weekly Housekeeping & Token Cleanup
 * Runs every Sunday at 03:00 (Asia/Karachi).
 * Cron: '0 3 * * 0'
 *
 * Deletes expired and revoked refresh tokens older than 30 days,
 * and clears expired password reset tokens from the users table.
 * Safe to re-run.
 */
export async function runCleanup() {
  const startTime = Date.now();
  logger.info(`[CRON] Starting weekly cleanup job...`);

  try {
    // 1. Delete expired or revoked refresh tokens older than 30 days
    const delTokensRes = await query(
      `DELETE FROM refresh_tokens 
       WHERE (revoked_at IS NOT NULL AND revoked_at < NOW() - INTERVAL 30 DAY)
          OR (expires_at < NOW() - INTERVAL 30 DAY)`
    );
    const tokensDeleted = delTokensRes.affectedRows || 0;

    // 2. Clear expired password reset tokens from users table
    const clearResetRes = await query(
      `UPDATE users 
       SET reset_password_token_hash = NULL, reset_password_expires_at = NULL 
       WHERE reset_password_expires_at IS NOT NULL 
         AND reset_password_expires_at < NOW()`
    );
    const resetTokensCleared = clearResetRes.affectedRows || 0;

    const durationMs = Date.now() - startTime;
    logger.info(
      `[CRON] Completed cleanup job: ${tokensDeleted} refresh tokens deleted, ${resetTokensCleared} reset tokens cleared in ${durationMs}ms.`
    );

    return {
      job: "cleanup",
      tokensDeleted,
      resetTokensCleared,
      durationMs,
    };
  } catch (err) {
    logger.error(`[CRON] Error during cleanup job: ${err.message}`);
    throw err;
  }
}

export default {
  cronTime: "0 3 * * 0",
  run: runCleanup,
};
