import { query } from "../config/db.js";
import { getCache, setCache } from "../utils/cache.js";
import {
  getTodayDateKarachi,
  getCurrentYearMonthKarachi,
  calculateAttendancePercentage,
} from "../utils/attendance.js";
import {
  getLastMonthYearKarachi,
  getLastNMonths,
  getCurrentWeekDaysKarachi,
  formatActivityText,
} from "../utils/dashboard.js";
import { calculateFeeStatus, calculateBalance, getMonthName } from "../utils/fee.js";

/**
 * 1. GET /dashboard/overview
 * Returns unified card metrics:
 * - Active students & change vs last month
 * - Today's attendance percentage and unmarked class count
 * - Current month fee collection, pending, overdue, and change vs last month
 * Cached in memory for 60 seconds per academy.
 *
 * @param {number} academyId
 * @returns {Promise<object>}
 */
export async function getOverview(academyId) {
  const cacheKey = `dashboard_overview_${academyId}`;
  const cached = getCache(cacheKey);
  if (cached) {
    return { ...cached, isCached: true };
  }

  const { year: curYear, month: curMonth } = getCurrentYearMonthKarachi();
  const { year: prevYear, month: prevMonth } = getLastMonthYearKarachi();
  const todayStr = getTodayDateKarachi();

  // -------------------------------------------------------------
  // Query 1: Active students and comparison with end of last month
  // -------------------------------------------------------------
  const daysInPrevMonth = new Date(prevYear, prevMonth, 0).getDate();
  const prevMonthEnd = `${prevYear}-${String(prevMonth).padStart(2, "0")}-${String(daysInPrevMonth).padStart(2, "0")}`;

  const studentCounts = await query(
    `SELECT 
       COUNT(*) AS total_active,
       COUNT(CASE WHEN admission_date <= :prevMonthEnd THEN 1 END) AS last_month_active
     FROM students
     WHERE academy_id = :academyId AND status = 'active' AND deleted_at IS NULL`,
    { academyId, prevMonthEnd }
  );

  const currentStudents = Number(studentCounts[0]?.total_active || 0);
  const previousStudents = Number(studentCounts[0]?.last_month_active || 0);
  const studentDiff = currentStudents - previousStudents;
  const studentDirection = studentDiff > 0 ? "up" : studentDiff < 0 ? "down" : "neutral";
  const studentChangePercent = previousStudents > 0
    ? Math.round((Math.abs(studentDiff) / previousStudents) * 1000) / 10
    : 0;

  // -------------------------------------------------------------
  // Query 2: Today's attendance & unmarked classes count
  // -------------------------------------------------------------
  // Determine current day of week abbreviation (Mon, Tue, Wed, Thu, Fri, Sat, Sun)
  const [ty, tm, td] = todayStr.split("-").map(Number);
  const dateObj = new Date(Date.UTC(ty, tm - 1, td));
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const currentDayName = dayNames[dateObj.getUTCDay()];

  // Active classes scheduled for today
  const scheduledClasses = await query(
    `SELECT id FROM classes 
     WHERE academy_id = :academyId AND is_active = TRUE AND deleted_at IS NULL
       AND FIND_IN_SET(:currentDayName, REPLACE(days_of_week, ' ', '')) > 0`,
    { academyId, currentDayName }
  );

  // Classes that have attendance marked today
  const markedClasses = await query(
    `SELECT DISTINCT class_id FROM attendance 
     WHERE academy_id = :academyId AND date = :todayStr`,
    { academyId, todayStr }
  );

  // Today attendance status tally
  const todayAttRows = await query(
    `SELECT status, COUNT(*) AS count
     FROM attendance
     WHERE academy_id = :academyId AND date = :todayStr
     GROUP BY status`,
    { academyId, todayStr }
  );

  let present = 0, late = 0, absent = 0, leave = 0;
  for (const r of todayAttRows) {
    if (r.status === "present") present = Number(r.count);
    if (r.status === "late") late = Number(r.count);
    if (r.status === "absent") absent = Number(r.count);
    if (r.status === "leave") leave = Number(r.count);
  }

  const todayAttendancePercent = calculateAttendancePercentage(present, late, absent);
  const classesNotMarkedToday = Math.max(0, scheduledClasses.length - markedClasses.length);

  // -------------------------------------------------------------
  // Query 3: Current month fee metrics and comparison with last month
  // -------------------------------------------------------------
  const feeRows = await query(
    `SELECT amount, paid_amount, late_fee, due_date, status
     FROM fees
     WHERE academy_id = :academyId AND month = :curMonth AND year = :curYear`,
    { academyId, curMonth, curYear }
  );

  let feesCollectedThisMonth = 0;
  let pendingFees = 0;
  let overdueFees = 0;
  let totalBilledThisMonth = 0;

  for (const f of feeRows) {
    const totalPayable = Number(f.amount) + Number(f.late_fee);
    const paid = Number(f.paid_amount);
    const balance = Math.max(0, totalPayable - paid);
    const computedStatus = calculateFeeStatus(f.amount, f.paid_amount, f.late_fee, f.due_date);

    feesCollectedThisMonth += paid;
    totalBilledThisMonth += totalPayable;

    if (computedStatus === "overdue") {
      overdueFees += balance;
    } else if (computedStatus === "pending" || computedStatus === "partial") {
      pendingFees += balance;
    }
  }

  const collectionPercent = totalBilledThisMonth > 0
    ? Math.round((feesCollectedThisMonth / totalBilledThisMonth) * 1000) / 10
    : 0;

  // Last month collected fees
  const prevFeeRes = await query(
    `SELECT COALESCE(SUM(paid_amount), 0) AS prev_collected
     FROM fees
     WHERE academy_id = :academyId AND month = :prevMonth AND year = :prevYear`,
    { academyId, prevMonth, prevYear }
  );
  const prevCollected = Number(prevFeeRes[0]?.prev_collected || 0);

  const feeDiff = feesCollectedThisMonth - prevCollected;
  const feeDirection = feeDiff > 0 ? "up" : feeDiff < 0 ? "down" : "neutral";
  const feeChangePercent = prevCollected > 0
    ? Math.round((Math.abs(feeDiff) / prevCollected) * 1000) / 10
    : 0;

  // -------------------------------------------------------------
  // Assemble full overview payload and cache for 60 seconds
  // -------------------------------------------------------------
  const overview = {
    students: {
      totalActive: currentStudents,
      previousMonthActive: previousStudents,
      change: studentDiff,
      changePercent: studentChangePercent,
      direction: studentDirection,
    },
    attendance: {
      todayAttendancePercent,
      classesScheduledToday: scheduledClasses.length,
      classesMarkedToday: markedClasses.length,
      classesNotMarkedToday,
      todayStats: { present, late, absent, leave },
    },
    fees: {
      feesCollectedThisMonth,
      pendingFees,
      overdueFees,
      totalBilledThisMonth,
      collectionPercent,
      changeVersusLastMonth: {
        change: feeDiff,
        changePercent: feeChangePercent,
        direction: feeDirection,
        previousMonthCollected: prevCollected,
      },
    },
  };

  setCache(cacheKey, overview, 60);
  return { ...overview, isCached: false };
}

/**
 * 2. GET /dashboard/fees-trend?months=6
 * Returns monthly collection trend for the last N months without gaps.
 *
 * @param {number} academyId
 * @param {number} monthsCount
 * @returns {Promise<Array<{ month: string, label: string, collected: number }>>}
 */
export async function getFeesTrend(academyId, monthsCount = 6) {
  const months = getLastNMonths(monthsCount);
  const startDate = `${months[0].key}-01`;
  const endMonth = months[months.length - 1];
  const daysInEndMonth = new Date(endMonth.year, endMonth.month, 0).getDate();
  const endDate = `${endMonth.key}-${String(daysInEndMonth).padStart(2, "0")}`;

  // Aggregated payments by year and month
  const rows = await query(
    `SELECT 
       YEAR(paid_on) AS pay_year,
       MONTH(paid_on) AS pay_month,
       COALESCE(SUM(amount), 0) AS total_collected
     FROM payments
     WHERE academy_id = :academyId
       AND paid_on >= :startDate
       AND paid_on <= :endDate
     GROUP BY YEAR(paid_on), MONTH(paid_on)`,
    { academyId, startDate, endDate }
  );

  const paymentMap = new Map();
  for (const r of rows) {
    paymentMap.set(`${r.pay_year}-${r.pay_month}`, Number(r.total_collected));
  }

  return months.map((m) => ({
    month: m.key,
    label: m.label,
    collected: paymentMap.get(`${m.year}-${m.month}`) || 0,
  }));
}

/**
 * 3. GET /dashboard/fee-status?month=&year=
 * Aggregates fees into Paid, Pending, Partial, and Overdue for donut charts.
 *
 * @param {number} academyId
 * @param {{ month?: number, year?: number }} filters
 * @returns {Promise<Array<{ status: string, label: string, count: number, amount: number }>>}
 */
export async function getFeeStatus(academyId, filters) {
  const current = getCurrentYearMonthKarachi();
  const targetMonth = filters.month ? Number(filters.month) : current.month;
  const targetYear = filters.year ? Number(filters.year) : current.year;

  const rows = await query(
    `SELECT amount, paid_amount, late_fee, due_date
     FROM fees
     WHERE academy_id = :academyId AND month = :targetMonth AND year = :targetYear`,
    { academyId, targetMonth, targetYear }
  );

  const tally = {
    paid: { count: 0, amount: 0 },
    pending: { count: 0, amount: 0 },
    partial: { count: 0, amount: 0 },
    overdue: { count: 0, amount: 0 },
  };

  for (const r of rows) {
    const status = calculateFeeStatus(r.amount, r.paid_amount, r.late_fee, r.due_date);
    const balance = calculateBalance(r.amount, r.paid_amount, r.late_fee);

    if (status === "paid") {
      tally.paid.count++;
      tally.paid.amount += Number(r.paid_amount);
    } else if (status === "overdue") {
      tally.overdue.count++;
      tally.overdue.amount += balance;
    } else if (status === "partial") {
      tally.partial.count++;
      tally.partial.amount += balance;
    } else {
      tally.pending.count++;
      tally.pending.amount += balance;
    }
  }

  return [
    { status: "paid", label: "Paid", count: tally.paid.count, amount: tally.paid.amount },
    { status: "pending", label: "Pending", count: tally.pending.count, amount: tally.pending.amount },
    { status: "partial", label: "Partial", count: tally.partial.count, amount: tally.partial.amount },
    { status: "overdue", label: "Overdue", count: tally.overdue.count, amount: tally.overdue.amount },
  ];
}

/**
 * 4. GET /dashboard/attendance-weekly
 * Attendance percentage for each day of the current week (Monday to Saturday).
 *
 * @param {number} academyId
 * @returns {Promise<Array<{ day: string, date: string, percentage: number, present: number, total: number }>>}
 */
export async function getAttendanceWeekly(academyId) {
  const weekDays = getCurrentWeekDaysKarachi();
  const startDate = weekDays[0].date;
  const endDate = weekDays[weekDays.length - 1].date;

  const rows = await query(
    `SELECT 
       date,
       status,
       COUNT(*) AS count
     FROM attendance
     WHERE academy_id = :academyId
       AND date >= :startDate
       AND date <= :endDate
     GROUP BY date, status`,
    { academyId, startDate, endDate }
  );

  // Group status counts by date
  const dayMap = new Map();
  for (const r of rows) {
    const dStr = typeof r.date === "string" ? r.date.slice(0, 10) : new Date(r.date).toISOString().slice(0, 10);
    if (!dayMap.has(dStr)) {
      dayMap.set(dStr, { present: 0, late: 0, absent: 0, leave: 0 });
    }
    const counts = dayMap.get(dStr);
    if (r.status === "present") counts.present += Number(r.count);
    if (r.status === "late") counts.late += Number(r.count);
    if (r.status === "absent") counts.absent += Number(r.count);
    if (r.status === "leave") counts.leave += Number(r.count);
  }

  return weekDays.map((wd) => {
    const counts = dayMap.get(wd.date) || { present: 0, late: 0, absent: 0, leave: 0 };
    const pct = calculateAttendancePercentage(counts.present, counts.late, counts.absent);
    const validTotal = counts.present + counts.late + counts.absent + counts.leave;

    return {
      day: wd.day,
      date: wd.date,
      percentage: pct,
      present: counts.present,
      absent: counts.absent,
      late: counts.late,
      leave: counts.leave,
      total: validTotal,
    };
  });
}

/**
 * 5. GET /dashboard/fees-due?days=7
 * Returns students whose fees are due within the next N days or are overdue (limit 10).
 *
 * @param {number} academyId
 * @param {number} days
 * @returns {Promise<Array<object>>}
 */
export async function getFeesDue(academyId, days = 7) {
  const sql = `
    SELECT 
      f.id AS fee_id,
      f.month,
      f.year,
      f.amount,
      f.late_fee,
      f.paid_amount,
      (f.amount + f.late_fee - f.paid_amount) AS balance,
      f.due_date,
      DATEDIFF(CURRENT_DATE(), f.due_date) AS days_overdue,
      s.id AS student_id,
      s.name AS student_name,
      s.roll_no,
      s.parent_phone,
      c.name AS class_name
    FROM fees f
    JOIN students s ON f.student_id = s.id
    JOIN classes c ON s.class_id = c.id
    WHERE f.academy_id = :academyId
      AND s.deleted_at IS NULL
      AND (f.amount + f.late_fee) > f.paid_amount
      AND f.due_date <= DATE_ADD(CURRENT_DATE(), INTERVAL :days DAY)
    ORDER BY 
      CASE WHEN f.due_date < CURRENT_DATE() THEN 0 ELSE 1 END,
      f.due_date ASC,
      balance DESC
    LIMIT 10
  `;

  const rows = await query(sql, { academyId, days: Number(days) });

  return rows.map((r) => {
    const isOverdue = new Date(r.due_date) < new Date(getTodayDateKarachi());
    return {
      feeId: r.fee_id,
      studentId: r.student_id,
      studentName: r.student_name,
      rollNo: r.roll_no,
      className: r.class_name,
      parentPhone: r.parent_phone,
      month: r.month,
      monthName: getMonthName(r.month),
      year: r.year,
      amount: r.amount,
      lateFee: r.late_fee,
      paidAmount: r.paid_amount,
      balance: r.balance,
      dueDate: r.due_date,
      isOverdue,
      daysOverdue: isOverdue ? Math.max(0, r.days_overdue) : 0,
    };
  });
}

/**
 * 6. GET /dashboard/recent-activity?limit=10
 * Returns latest activities in readable human text.
 *
 * @param {number} academyId
 * @param {number} limit
 * @returns {Promise<Array<object>>}
 */
export async function getRecentActivity(academyId, limit = 10) {
  const sql = `
    SELECT 
      al.id,
      al.action,
      al.entity,
      al.entity_id,
      al.meta,
      al.created_at,
      u.name AS user_name,
      s.name AS student_name,
      c.name AS class_name
    FROM activity_logs al
    LEFT JOIN users u ON al.user_id = u.id
    LEFT JOIN students s ON al.entity = 'student' AND al.entity_id = s.id
    LEFT JOIN classes c ON al.entity = 'class' AND al.entity_id = c.id
    WHERE al.academy_id = :academyId
    ORDER BY al.id DESC
    LIMIT :limit
  `;

  const rows = await query(sql, { academyId, limit: Number(limit) });

  return rows.map((r) => ({
    id: r.id,
    action: r.action,
    entity: r.entity,
    entityId: r.entity_id,
    text: formatActivityText(r),
    userName: r.user_name || "System",
    createdAt: r.created_at,
  }));
}

/**
 * 7. GET /dashboard/top-classes
 * Ranks active classes by attendance rate for the current month.
 *
 * @param {number} academyId
 * @returns {Promise<Array<object>>}
 */
export async function getTopClasses(academyId) {
  const { year: curYear, month: curMonth } = getCurrentYearMonthKarachi();

  const sql = `
    SELECT 
      c.id AS class_id,
      c.name AS class_name,
      c.section AS class_section,
      t.name AS teacher_name,
      COUNT(DISTINCT s.id) AS total_students,
      COALESCE(SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END), 0) AS present_count,
      COALESCE(SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END), 0) AS late_count,
      COALESCE(SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END), 0) AS absent_count
    FROM classes c
    LEFT JOIN teachers t ON c.teacher_id = t.id
    LEFT JOIN students s ON s.class_id = c.id AND s.status = 'active' AND s.deleted_at IS NULL
    LEFT JOIN attendance a ON a.class_id = c.id AND MONTH(a.date) = :curMonth AND YEAR(a.date) = :curYear
    WHERE c.academy_id = :academyId AND c.is_active = TRUE AND c.deleted_at IS NULL
    GROUP BY c.id, c.name, c.section, t.name
  `;

  const rows = await query(sql, { academyId, curMonth, curYear });

  const classes = rows.map((r) => {
    const present = Number(r.present_count);
    const late = Number(r.late_count);
    const absent = Number(r.absent_count);
    const attendanceRate = calculateAttendancePercentage(present, late, absent);

    return {
      classId: r.class_id,
      className: r.class_name,
      classSection: r.class_section,
      teacherName: r.teacher_name || "Unassigned",
      totalStudents: Number(r.total_students),
      attendanceRate,
    };
  });

  // Rank descending by attendanceRate
  classes.sort((a, b) => b.attendanceRate - a.attendanceRate);
  return classes;
}

export default {
  getOverview,
  getFeesTrend,
  getFeeStatus,
  getAttendanceWeekly,
  getFeesDue,
  getRecentActivity,
  getTopClasses,
};
