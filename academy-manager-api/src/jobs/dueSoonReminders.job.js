import { query } from "../config/db.js";
import { getMonthName } from "../utils/fee.js";
import { toInternationalPakistaniPhone } from "../utils/phone.js";
import logger from "../utils/logger.js";

/**
 * Replaces placeholders in the academy template.
 */
function renderTemplate(template, vars) {
  let rendered = template || "";
  for (const [key, value] of Object.entries(vars)) {
    const regex = new RegExp(`\\{${key}\\}`, "g");
    rendered = rendered.replace(regex, String(value !== null && value !== undefined ? value : ""));
  }
  return rendered;
}

/**
 * Job 3: Queue Reminders for Fees Due Soon
 * Runs every day at 09:00 (Asia/Karachi).
 * Cron: '0 9 * * *'
 *
 * For academies with WhatsApp reminders enabled, queues reminders (status 'queued')
 * for invoices due within the next 3 days, making them accessible in the pending queue.
 * Re-run safe (skips fees already queued or notified within last 24h).
 */
export async function runDueSoonReminders(targetAcademyId = null) {
  const startTime = Date.now();
  logger.info(`[CRON] Starting dueSoonReminders job...`);

  let academySql = `SELECT id, name, reminder_template, notification_settings FROM academies WHERE is_active = TRUE`;
  const academyParams = {};
  if (targetAcademyId) {
    academySql += ` AND id = :targetAcademyId`;
    academyParams.targetAcademyId = Number(targetAcademyId);
  }

  const academies = await query(academySql, academyParams);

  let grandQueued = 0;

  for (const academy of academies) {
    // Check if whatsapp reminders are enabled
    let notifs = { whatsappReminders: true };
    if (academy.notification_settings) {
      try {
        const parsed = typeof academy.notification_settings === "string"
          ? JSON.parse(academy.notification_settings)
          : academy.notification_settings;
        notifs = { ...notifs, ...parsed };
      } catch {
        // default enabled
      }
    }

    if (!notifs.whatsappReminders) {
      continue;
    }

    const template =
      academy.reminder_template ||
      "Dear Parent, fee of Rs {amount} for {student} is due on {dueDate}. Please clear dues for {month}. - {academy}";

    // Unpaid fees due within the next 3 days (CURRENT_DATE() to CURRENT_DATE() + 3 days)
    const fees = await query(
      `SELECT 
         f.id AS fee_id,
         f.month,
         f.year,
         f.due_date,
         (f.amount + f.late_fee - f.paid_amount) AS balance,
         s.id AS student_id,
         s.name AS student_name,
         s.parent_phone
       FROM fees f
       JOIN students s ON f.student_id = s.id
       WHERE f.academy_id = :academyId
         AND s.deleted_at IS NULL
         AND s.status = 'active'
         AND (f.amount + f.late_fee) > f.paid_amount
         AND f.due_date >= CURRENT_DATE()
         AND f.due_date <= DATE_ADD(CURRENT_DATE(), INTERVAL 3 DAY)`,
      { academyId: academy.id }
    );

    let academyQueuedCount = 0;

    for (const f of fees) {
      // Check if already queued or sent within the last 24 hours
      const existing = await query(
        `SELECT id FROM reminder_logs 
         WHERE academy_id = :academyId 
           AND student_id = :studentId 
           AND fee_id = :feeId 
           AND sent_at >= NOW() - INTERVAL 24 HOUR LIMIT 1`,
        { academyId: academy.id, studentId: f.student_id, feeId: f.fee_id }
      );

      if (existing && existing.length > 0) {
        continue; // Skip: already queued or sent recently
      }

      const balance = Number(f.balance);
      const message = renderTemplate(template, {
        student: f.student_name,
        amount: balance.toLocaleString("en-PK"),
        dueDate: f.due_date,
        month: getMonthName(f.month),
        academy: academy.name,
      });

      await query(
        `INSERT INTO reminder_logs (academy_id, student_id, recipient_phone, fee_id, channel, message, status, sent_at)
         VALUES (:academyId, :studentId, :recipientPhone, :feeId, 'whatsapp', :message, 'queued', NOW())`,
        {
          academyId: academy.id,
          studentId: f.student_id,
          recipientPhone: toInternationalPakistaniPhone(f.parent_phone),
          feeId: f.fee_id,
          message,
        }
      );

      academyQueuedCount++;
      grandQueued++;
    }

    if (academyQueuedCount > 0) {
      logger.info(
        `[CRON] Academy '${academy.name}' (ID ${academy.id}): Queued ${academyQueuedCount} upcoming fee reminders.`
      );
    }
  }

  const durationMs = Date.now() - startTime;
  logger.info(
    `[CRON] Completed dueSoonReminders: ${grandQueued} reminders queued in ${durationMs}ms.`
  );

  return {
    job: "dueSoonReminders",
    grandQueued,
    durationMs,
  };
}

export default {
  cronTime: "0 9 * * *",
  run: runDueSoonReminders,
};
