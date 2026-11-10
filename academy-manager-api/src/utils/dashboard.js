import { getTodayDateKarachi, getCurrentYearMonthKarachi } from "./attendance.js";
import { getMonthName } from "./fee.js";

/**
 * Returns previous month and year relative to current Karachi date.
 */
export function getLastMonthYearKarachi() {
  const { year, month } = getCurrentYearMonthKarachi();
  if (month === 1) {
    return { year: year - 1, month: 12 };
  }
  return { year, month: month - 1 };
}

/**
 * Returns chronological array of the last N months ending with current month.
 *
 * @param {number} count - Number of months (default: 6)
 * @returns {Array<{ year: number, month: number, key: string, monthName: string, label: string }>}
 */
export function getLastNMonths(count = 6) {
  const current = getCurrentYearMonthKarachi();
  const months = [];
  for (let i = count - 1; i >= 0; i--) {
    let y = current.year;
    let m = current.month - i;
    while (m <= 0) {
      m += 12;
      y -= 1;
    }
    const monthStr = String(m).padStart(2, "0");
    months.push({
      year: y,
      month: m,
      key: `${y}-${monthStr}`,
      monthName: getMonthName(m),
      label: `${getMonthName(m)} ${y}`,
    });
  }
  return months;
}

/**
 * Returns array of days for Monday to Saturday of the current week (Asia/Karachi).
 *
 * @returns {Array<{ day: string, date: string }>}
 */
export function getCurrentWeekDaysKarachi() {
  const todayStr = getTodayDateKarachi();
  const [y, m, d] = todayStr.split("-").map(Number);
  const dateObj = new Date(Date.UTC(y, m - 1, d));
  const dayOfWeek = dateObj.getUTCDay(); // 0 is Sun, 1 is Mon, 6 is Sat
  const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monDate = new Date(Date.UTC(y, m - 1, d + diffToMon));

  const days = [];
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  for (let i = 0; i < 6; i++) {
    const cur = new Date(Date.UTC(monDate.getUTCFullYear(), monDate.getUTCMonth(), monDate.getUTCDate() + i));
    const ds = cur.toISOString().slice(0, 10);
    days.push({
      day: dayNames[i],
      date: ds,
    });
  }
  return days;
}

/**
 * Formats activity logs into readable sentences.
 *
 * @param {object} log - Activity log row
 * @returns {string} Human-friendly description
 */
export function formatActivityText(log) {
  let meta = {};
  if (log.meta) {
    try {
      meta = typeof log.meta === "string" ? JSON.parse(log.meta) : log.meta;
    } catch {
      meta = {};
    }
  }

  const actor = log.user_name || "Staff";

  switch (log.action) {
    case "fee_payment_collected": {
      const amountStr = meta.amount ? `Rs ${Number(meta.amount).toLocaleString()}` : "fee payment";
      const methodStr = meta.method ? ` via ${meta.method}` : "";
      const studentStr = log.student_name ? `${log.student_name} ` : "";
      return `${studentStr}paid ${amountStr}${methodStr}`;
    }
    case "fee_payment_reversed": {
      const amountStr = meta.amount ? `Rs ${Number(meta.amount).toLocaleString()}` : "payment";
      const reasonStr = meta.reason ? ` (${meta.reason})` : "";
      return `Reversed ${amountStr} for ${log.student_name || "student"}${reasonStr}`;
    }
    case "fee_adjusted": {
      return `Fee adjusted for ${log.student_name || "student"}`;
    }
    case "fee_structure_updated": {
      return `Monthly fee structure updated by ${actor}`;
    }
    case "attendance_marked": {
      return `Attendance marked for ${log.class_name || "class"} by ${actor}`;
    }
    case "exam_created": {
      return `Created exam: ${meta.name || log.entity_id || "new exam"}`;
    }
    case "exam_published": {
      return `Published exam results for ${log.class_name || "class"}`;
    }
    case "student_created": {
      return `Admitted new student: ${log.student_name || "student"}`;
    }
    default:
      return `${log.action.replace(/_/g, " ")} by ${actor}`;
  }
}

export default {
  getLastMonthYearKarachi,
  getLastNMonths,
  getCurrentWeekDaysKarachi,
  formatActivityText,
};

