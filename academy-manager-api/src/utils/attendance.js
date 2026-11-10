/**
 * Attendance calculation helpers and timezone-aware date utilities.
 * Configured for Pakistan Standard Time (Asia/Karachi, UTC+5).
 */

/**
 * Calculates attendance percentage according to business rules:
 * Attendance % = (present + late) / (present + late + absent) * 100
 * Leave days are excluded from the denominator.
 *
 * @param {number} present 
 * @param {number} late 
 * @param {number} absent 
 * @returns {number} Rounded to 1 decimal place (e.g. 85.5)
 */
export function calculateAttendancePercentage(present = 0, late = 0, absent = 0) {
  const p = Number(present) || 0;
  const l = Number(late) || 0;
  const a = Number(absent) || 0;

  const validDays = p + l + a;
  if (validDays === 0) {
    return 0.0;
  }

  const pct = ((p + l) / validDays) * 100;
  return Math.round(pct * 10) / 10;
}

/**
 * Returns today's date in YYYY-MM-DD format in Asia/Karachi timezone.
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
 * Returns current month and year in Asia/Karachi timezone.
 * @returns {{ year: number, month: number }}
 */
export function getCurrentYearMonthKarachi() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Karachi",
    year: "numeric",
    month: "numeric",
  }).formatToParts(new Date());

  const year = parseInt(parts.find((p) => p.type === "year").value, 10);
  const month = parseInt(parts.find((p) => p.type === "month").value, 10);
  return { year, month };
}

/**
 * Checks whether a given YYYY-MM-DD string falls on Sunday.
 * @param {string} dateStr 
 * @returns {boolean}
 */
export function isSunday(dateStr) {
  if (!dateStr) return false;
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.getUTCDay() === 0;
}

export default {
  calculateAttendancePercentage,
  getTodayDateKarachi,
  getCurrentYearMonthKarachi,
  isSunday,
};

