import logger from "../utils/logger.js";

/**
 * Scheduled background automation jobs (node-cron).
 * Ready for automated daily attendance digests, WhatsApp payment reminders, and month-end invoicing.
 */
export function initJobs() {
  logger.info("Cron jobs initialized (idle).");
}

export default {
  initJobs,
};

