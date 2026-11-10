/**
 * Fee utility functions for Tuition Academy Manager.
 * Handles fee status computation, receipt generation, and balance calculation.
 */

/**
 * Returns today's date in YYYY-MM-DD format in Asia/Karachi (UTC+5).
 * @returns {string} e.g. "2026-11-09"
 */
export function getTodayDateKarachi() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Karachi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/**
 * Returns current month and year in Asia/Karachi (UTC+5).
 * @returns {{ year: number, month: number }}
 */
export function getCurrentYearMonthKarachi() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Karachi",
    year: "numeric",
    month: "numeric",
  }).formatToParts(new Date());

  const year = parseInt(parts.find((p) => p.type === "year")?.value || "2026", 10);
  const month = parseInt(parts.find((p) => p.type === "month")?.value || "1", 10);

  return { year, month };
}

/**
 * Returns full English name of the month.
 * @param {number} month - 1 to 12
 * @returns {string}
 */
export function getMonthName(month) {
  const monthNames = [
    "",
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return monthNames[Number(month)] || `Month ${month}`;
}

/**
 * Calculates fee status consistently across the application:
 * - 'paid': paidAmount >= (amount + lateFee)
 * - 'overdue': balance > 0 and dueDate < today
 * - 'partial': balance > 0 and paidAmount > 0 and dueDate >= today
 * - 'pending': balance > 0 and paidAmount === 0 and dueDate >= today
 *
 * @param {number} amount - Base fee invoice amount
 * @param {number} paidAmount - Total paid so far
 * @param {number} lateFee - Late fee surcharge
 * @param {string|Date} dueDate - Due date string "YYYY-MM-DD"
 * @returns {"paid"|"overdue"|"partial"|"pending"}
 */
export function calculateFeeStatus(amount, paidAmount, lateFee, dueDate) {
  const netAmount = Number(amount) || 0;
  const netLateFee = Number(lateFee) || 0;
  const netPaid = Number(paidAmount) || 0;
  const totalPayable = netAmount + netLateFee;

  if (netPaid >= totalPayable) {
    return "paid";
  }

  // Normalize dueDate to "YYYY-MM-DD"
  let dueDateStr = "";
  if (dueDate instanceof Date) {
    dueDateStr = dueDate.toISOString().slice(0, 10);
  } else if (typeof dueDate === "string") {
    dueDateStr = dueDate.slice(0, 10);
  }

  const todayStr = getTodayDateKarachi();

  if (dueDateStr && dueDateStr < todayStr) {
    return "overdue";
  }

  if (netPaid > 0) {
    return "partial";
  }

  return "pending";
}

/**
 * Calculates remaining balance for a fee.
 *
 * @param {number} amount
 * @param {number} paidAmount
 * @param {number} lateFee
 * @returns {number} Whole PKR integer balance
 */
export function calculateBalance(amount, paidAmount, lateFee) {
  const total = (Number(amount) || 0) + (Number(lateFee) || 0);
  const paid = Number(paidAmount) || 0;
  return Math.max(0, total - paid);
}

/**
 * Concurrency-safe sequential receipt number generator.
 * Formats: RCPT-YYYY-000001, sequential per year per academy.
 * Must be executed within an active database transaction.
 *
 * @param {import('mysql2/promise').PoolConnection} conn - Active transaction connection
 * @param {number} academyId
 * @param {number} year
 * @returns {Promise<string>}
 */
export async function generateReceiptNumber(conn, academyId, year) {
  const pattern = `RCPT-${year}-%`;

  const [rows] = await conn.query(
    `SELECT MAX(CAST(SUBSTRING(receipt_no, 11) AS UNSIGNED)) AS max_seq
     FROM payments
     WHERE academy_id = :academyId AND receipt_no LIKE :pattern
     FOR UPDATE`,
    { academyId, pattern }
  );

  let nextSeq = 1;
  if (rows && rows.length > 0 && rows[0].max_seq != null) {
    nextSeq = Number(rows[0].max_seq) + 1;
  }

  return `RCPT-${year}-${String(nextSeq).padStart(6, "0")}`;
}

export default {
  getTodayDateKarachi,
  getCurrentYearMonthKarachi,
  getMonthName,
  calculateFeeStatus,
  calculateBalance,
  generateReceiptNumber,
};

