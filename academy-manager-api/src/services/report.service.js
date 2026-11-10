import { query } from "../config/db.js";
import ApiError from "../utils/ApiError.js";
import {
  getTodayDateKarachi,
  getCurrentYearMonthKarachi,
  calculateAttendancePercentage,
} from "../utils/attendance.js";
import { getMonthName, calculateFeeStatus, calculateBalance } from "../utils/fee.js";
import { calculatePercentage, calculateGrade, isSubjectPassed } from "../utils/grade.js";
import { getLastNMonths } from "../utils/dashboard.js";

/**
 * Escapes values for safe RFC 4180 CSV export.
 */
function escapeCsv(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * 1. GET /reports/fee-collection?from=&to=&classId=&groupBy=day|month
 * Daily or monthly collection totals, split by payment method.
 *
 * @param {number} academyId
 * @param {object} filters
 * @returns {Promise<object>}
 */
export async function getFeeCollectionReport(academyId, filters) {
  const { from, to, classId, groupBy = "day", format = "json" } = filters;
  const current = getCurrentYearMonthKarachi();
  const defaultFrom = from || `${current.year}-01-01`;
  const defaultTo = to || getTodayDateKarachi();

  const periodFormat = groupBy === "month" ? "%Y-%m" : "%Y-%m-%d";

  let sql = `
    SELECT 
      DATE_FORMAT(p.paid_on, '${periodFormat}') AS period,
      p.method,
      COALESCE(SUM(p.amount), 0) AS total_amount,
      COUNT(p.id) AS payment_count
    FROM payments p
    JOIN students s ON p.student_id = s.id
    WHERE p.academy_id = :academyId
      AND p.paid_on >= :defaultFrom
      AND p.paid_on <= :defaultTo
  `;
  const params = { academyId, defaultFrom, defaultTo };

  if (classId) {
    sql += ` AND s.class_id = :classId`;
    params.classId = Number(classId);
  }

  sql += ` GROUP BY period, p.method ORDER BY period ASC`;

  const rows = await query(sql, params);

  // Group by period
  const periodMap = new Map();
  const methodTotals = {
    cash: 0,
    jazzcash: 0,
    easypaisa: 0,
    bank_transfer: 0,
  };
  let grandTotal = 0;
  let totalTransactions = 0;

  for (const r of rows) {
    if (!periodMap.has(r.period)) {
      periodMap.set(r.period, {
        period: r.period,
        cash: 0,
        jazzcash: 0,
        easypaisa: 0,
        bank_transfer: 0,
        totalAmount: 0,
        transactionCount: 0,
      });
    }

    const item = periodMap.get(r.period);
    const amt = Number(r.total_amount);
    const count = Number(r.payment_count);

    if (item[r.method] !== undefined) {
      item[r.method] += amt;
    }
    item.totalAmount += amt;
    item.transactionCount += count;

    if (methodTotals[r.method] !== undefined) {
      methodTotals[r.method] += amt;
    }
    grandTotal += amt;
    totalTransactions += count;
  }

  const data = Array.from(periodMap.values());

  if (format === "csv") {
    const headers = [
      "Period",
      "Cash (PKR)",
      "JazzCash (PKR)",
      "EasyPaisa (PKR)",
      "Bank Transfer (PKR)",
      "Total Collected (PKR)",
      "Transactions Count",
    ];
    const lines = [headers.join(",")];
    for (const d of data) {
      lines.push(
        [
          escapeCsv(d.period),
          d.cash,
          d.jazzcash,
          d.easypaisa,
          d.bank_transfer,
          d.totalAmount,
          d.transactionCount,
        ].join(",")
      );
    }
    lines.push(
      [
        '"TOTAL"',
        methodTotals.cash,
        methodTotals.jazzcash,
        methodTotals.easypaisa,
        methodTotals.bank_transfer,
        grandTotal,
        totalTransactions,
      ].join(",")
    );

    return {
      isCsv: true,
      csv: lines.join("\r\n"),
      filename: `fee-collection-${defaultFrom}-to-${defaultTo}.csv`,
    };
  }

  return {
    isCsv: false,
    range: { from: defaultFrom, to: defaultTo },
    groupBy,
    grandTotal,
    totalTransactions,
    methodTotals,
    data,
  };
}

/**
 * 2. GET /reports/outstanding
 * All unpaid fee balances grouped by class and student.
 *
 * @param {number} academyId
 * @param {object} filters
 * @returns {Promise<object>}
 */
export async function getOutstandingReport(academyId, filters) {
  const { classId, format = "json" } = filters;

  let sql = `
    SELECT 
      c.id AS class_id,
      c.name AS class_name,
      c.section AS class_section,
      s.id AS student_id,
      s.name AS student_name,
      s.roll_no,
      s.father_name,
      s.parent_phone,
      f.id AS fee_id,
      f.month,
      f.year,
      f.amount,
      f.late_fee,
      f.paid_amount,
      (f.amount + f.late_fee - f.paid_amount) AS balance,
      f.due_date,
      DATEDIFF(CURRENT_DATE(), f.due_date) AS days_overdue
    FROM fees f
    JOIN students s ON f.student_id = s.id
    JOIN classes c ON s.class_id = c.id
    WHERE f.academy_id = :academyId
      AND s.deleted_at IS NULL
      AND (f.amount + f.late_fee) > f.paid_amount
  `;
  const params = { academyId };

  if (classId) {
    sql += ` AND s.class_id = :classId`;
    params.classId = Number(classId);
  }

  sql += ` ORDER BY c.id ASC, s.roll_no ASC, f.year ASC, f.month ASC`;

  const rows = await query(sql, params);

  // Group by class and then student
  const classMap = new Map();
  let grandTotalOutstanding = 0;
  const uniqueStudentsWithDues = new Set();

  for (const r of rows) {
    grandTotalOutstanding += Number(r.balance);
    uniqueStudentsWithDues.add(r.student_id);

    if (!classMap.has(r.class_id)) {
      classMap.set(r.class_id, {
        classId: r.class_id,
        className: r.class_name,
        classSection: r.class_section,
        totalOutstanding: 0,
        studentCount: 0,
        studentsMap: new Map(),
      });
    }

    const classItem = classMap.get(r.class_id);
    classItem.totalOutstanding += Number(r.balance);

    if (!classItem.studentsMap.has(r.student_id)) {
      classItem.studentsMap.set(r.student_id, {
        studentId: r.student_id,
        studentName: r.student_name,
        rollNo: r.roll_no,
        fatherName: r.father_name,
        parentPhone: r.parent_phone,
        totalBalance: 0,
        unpaidMonthsCount: 0,
        unpaidInvoices: [],
      });
      classItem.studentCount++;
    }

    const studentItem = classItem.studentsMap.get(r.student_id);
    studentItem.totalBalance += Number(r.balance);
    studentItem.unpaidMonthsCount++;
    studentItem.unpaidInvoices.push({
      feeId: r.fee_id,
      month: r.month,
      monthName: getMonthName(r.month),
      year: r.year,
      amount: r.amount,
      lateFee: r.late_fee,
      paidAmount: r.paid_amount,
      balance: r.balance,
      dueDate: r.due_date,
      daysOverdue: Math.max(0, r.days_overdue),
    });
  }

  const classes = Array.from(classMap.values()).map((c) => ({
    classId: c.classId,
    className: c.className,
    classSection: c.classSection,
    totalOutstanding: c.totalOutstanding,
    studentCount: c.studentCount,
    students: Array.from(c.studentsMap.values()),
  }));

  if (format === "csv") {
    const headers = [
      "Class",
      "Roll No",
      "Student Name",
      "Father Name",
      "Parent Phone",
      "Unpaid Months Count",
      "Total Outstanding (PKR)",
    ];
    const lines = [headers.join(",")];
    for (const c of classes) {
      for (const s of c.students) {
        lines.push(
          [
            escapeCsv(c.className),
            escapeCsv(s.rollNo),
            escapeCsv(s.studentName),
            escapeCsv(s.fatherName),
            escapeCsv(s.parentPhone),
            s.unpaidMonthsCount,
            s.totalBalance,
          ].join(",")
        );
      }
    }
    lines.push(['"TOTAL ARREARS"', '""', '""', '""', '""', '""', grandTotalOutstanding].join(","));

    return {
      isCsv: true,
      csv: lines.join("\r\n"),
      filename: `outstanding-fees-report-${getTodayDateKarachi()}.csv`,
    };
  }

  return {
    isCsv: false,
    grandTotalOutstanding,
    totalStudentsWithDues: uniqueStudentsWithDues.size,
    totalClasses: classes.length,
    classes,
  };
}

/**
 * 3. GET /reports/attendance-summary?month=&year=&classId=
 * Attendance rate by class and a list of students with attendance < 75%.
 *
 * @param {number} academyId
 * @param {object} filters
 * @returns {Promise<object>}
 */
export async function getAttendanceSummaryReport(academyId, filters) {
  const current = getCurrentYearMonthKarachi();
  const targetMonth = filters.month ? Number(filters.month) : current.month;
  const targetYear = filters.year ? Number(filters.year) : current.year;
  const { classId, format = "json" } = filters;

  // 1. Class-level aggregation
  let classSql = `
    SELECT 
      c.id AS class_id,
      c.name AS class_name,
      c.section AS class_section,
      t.name AS teacher_name,
      COUNT(DISTINCT s.id) AS total_students,
      COALESCE(SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END), 0) AS present_count,
      COALESCE(SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END), 0) AS late_count,
      COALESCE(SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END), 0) AS absent_count,
      COALESCE(SUM(CASE WHEN a.status = 'leave' THEN 1 ELSE 0 END), 0) AS leave_count
    FROM classes c
    LEFT JOIN teachers t ON c.teacher_id = t.id
    LEFT JOIN students s ON s.class_id = c.id AND s.status = 'active' AND s.deleted_at IS NULL
    LEFT JOIN attendance a ON a.student_id = s.id AND MONTH(a.date) = :targetMonth AND YEAR(a.date) = :targetYear
    WHERE c.academy_id = :academyId AND c.is_active = TRUE AND c.deleted_at IS NULL
  `;
  const classParams = { academyId, targetMonth, targetYear };

  if (classId) {
    classSql += ` AND c.id = :classId`;
    classParams.classId = Number(classId);
  }
  classSql += ` GROUP BY c.id, c.name, c.section, t.name ORDER BY c.id ASC`;

  const classRows = await query(classSql, classParams);

  const classes = classRows.map((r) => {
    const present = Number(r.present_count);
    const late = Number(r.late_count);
    const absent = Number(r.absent_count);
    const rate = calculateAttendancePercentage(present, late, absent);

    return {
      classId: r.class_id,
      className: r.class_name,
      classSection: r.class_section,
      teacherName: r.teacher_name || "Unassigned",
      totalStudents: Number(r.total_students),
      presentCount: present,
      lateCount: late,
      absentCount: absent,
      leaveCount: Number(r.leave_count),
      attendanceRate: rate,
    };
  });

  // 2. Student-level aggregation for identifying < 75% low attendance
  let studentSql = `
    SELECT 
      s.id AS student_id,
      s.name AS student_name,
      s.roll_no,
      s.parent_phone,
      c.id AS class_id,
      c.name AS class_name,
      COALESCE(SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END), 0) AS present_count,
      COALESCE(SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END), 0) AS late_count,
      COALESCE(SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END), 0) AS absent_count,
      COALESCE(SUM(CASE WHEN a.status = 'leave' THEN 1 ELSE 0 END), 0) AS leave_count
    FROM students s
    JOIN classes c ON s.class_id = c.id
    LEFT JOIN attendance a ON a.student_id = s.id AND MONTH(a.date) = :targetMonth AND YEAR(a.date) = :targetYear
    WHERE s.academy_id = :academyId AND s.status = 'active' AND s.deleted_at IS NULL
  `;
  const studentParams = { academyId, targetMonth, targetYear };
  if (classId) {
    studentSql += ` AND s.class_id = :classId`;
    studentParams.classId = Number(classId);
  }
  studentSql += ` GROUP BY s.id, s.name, s.roll_no, s.parent_phone, c.id, c.name ORDER BY c.id ASC, s.roll_no ASC`;

  const studentRows = await query(studentSql, studentParams);

  const lowAttendanceStudents = [];
  for (const st of studentRows) {
    const present = Number(st.present_count);
    const late = Number(st.late_count);
    const absent = Number(st.absent_count);
    const validMarked = present + late + absent;

    // Only flag if attendance was marked for this student during the month
    if (validMarked > 0) {
      const pct = calculateAttendancePercentage(present, late, absent);
      if (pct < 75.0) {
        lowAttendanceStudents.push({
          studentId: st.student_id,
          studentName: st.student_name,
          rollNo: st.roll_no,
          className: st.class_name,
          parentPhone: st.parent_phone,
          present,
          late,
          absent,
          leave: Number(st.leave_count),
          attendancePercentage: pct,
        });
      }
    }
  }

  if (format === "csv") {
    const headers = [
      "Roll No",
      "Student Name",
      "Class",
      "Parent Phone",
      "Present",
      "Late",
      "Absent",
      "Leave",
      "Attendance %",
      "Low Attendance Alert",
    ];
    const lines = [headers.join(",")];
    for (const st of studentRows) {
      const p = Number(st.present_count);
      const l = Number(st.late_count);
      const a = Number(st.absent_count);
      const pct = calculateAttendancePercentage(p, l, a);
      const isLow = (p + l + a > 0 && pct < 75.0) ? "YES" : "NO";

      lines.push(
        [
          escapeCsv(st.roll_no),
          escapeCsv(st.student_name),
          escapeCsv(st.class_name),
          escapeCsv(st.parent_phone),
          p,
          l,
          a,
          st.leave_count,
          `${pct}%`,
          isLow,
        ].join(",")
      );
    }

    return {
      isCsv: true,
      csv: lines.join("\r\n"),
      filename: `attendance-summary-${targetYear}-${String(targetMonth).padStart(2, "0")}.csv`,
    };
  }

  return {
    isCsv: false,
    month: targetMonth,
    monthName: getMonthName(targetMonth),
    year: targetYear,
    classes,
    lowAttendanceStudents,
    lowAttendanceCount: lowAttendanceStudents.length,
  };
}

/**
 * 4. GET /reports/student-strength
 * Student count by class, gender, status, plus admissions and departures over last 12 months.
 *
 * @param {number} academyId
 * @param {object} filters
 * @returns {Promise<object>}
 */
export async function getStudentStrengthReport(academyId, filters) {
  const { format = "json" } = filters;

  // 1. Strength by class, gender, and status
  const classBreakdown = await query(
    `SELECT 
       c.id AS class_id,
       c.name AS class_name,
       c.section AS class_section,
       COUNT(s.id) AS total_students,
       COUNT(CASE WHEN s.status = 'active' THEN 1 END) AS active_students,
       COUNT(CASE WHEN s.status = 'inactive' THEN 1 END) AS inactive_students,
       COUNT(CASE WHEN s.status = 'left' THEN 1 END) AS left_students,
       COUNT(CASE WHEN s.gender = 'male' AND s.status = 'active' THEN 1 END) AS active_males,
       COUNT(CASE WHEN s.gender = 'female' AND s.status = 'active' THEN 1 END) AS active_females
     FROM classes c
     LEFT JOIN students s ON s.class_id = c.id AND s.deleted_at IS NULL
     WHERE c.academy_id = :academyId AND c.is_active = TRUE AND c.deleted_at IS NULL
     GROUP BY c.id, c.name, c.section
     ORDER BY c.id ASC`,
    { academyId }
  );

  // 2. Admissions and left departures over the last 12 months
  const last12Months = getLastNMonths(12);
  const startDate = `${last12Months[0].key}-01`;

  const admissionsRows = await query(
    `SELECT 
       DATE_FORMAT(admission_date, '%Y-%m') AS month_key,
       COUNT(*) AS count
     FROM students
     WHERE academy_id = :academyId
       AND admission_date >= :startDate
     GROUP BY month_key`,
    { academyId, startDate }
  );
  const admissionsMap = new Map(admissionsRows.map((r) => [r.month_key, Number(r.count)]));

  const leftRows = await query(
    `SELECT 
       DATE_FORMAT(deleted_at, '%Y-%m') AS month_key,
       COUNT(*) AS count
     FROM students
     WHERE academy_id = :academyId
       AND status = 'left'
       AND deleted_at >= :startDate
     GROUP BY month_key`,
    { academyId, startDate }
  );
  const leftMap = new Map(leftRows.map((r) => [r.month_key, Number(r.count)]));

  const monthlyFlow = last12Months.map((m) => ({
    month: m.key,
    label: m.label,
    admissions: admissionsMap.get(m.key) || 0,
    departures: leftMap.get(m.key) || 0,
  }));

  let totalActive = 0, totalMales = 0, totalFemales = 0;
  for (const c of classBreakdown) {
    totalActive += Number(c.active_students);
    totalMales += Number(c.active_males);
    totalFemales += Number(c.active_females);
  }

  if (format === "csv") {
    const headers = [
      "Class",
      "Active Students",
      "Active Males",
      "Active Females",
      "Inactive Students",
      "Left Students",
      "Total Registered",
    ];
    const lines = [headers.join(",")];
    for (const c of classBreakdown) {
      lines.push(
        [
          escapeCsv(c.class_name),
          c.active_students,
          c.active_males,
          c.active_females,
          c.inactive_students,
          c.left_students,
          c.total_students,
        ].join(",")
      );
    }
    lines.push(['"TOTAL STRENGTH"', totalActive, totalMales, totalFemales, '""', '""', '""'].join(","));

    return {
      isCsv: true,
      csv: lines.join("\r\n"),
      filename: `student-strength-report-${getTodayDateKarachi()}.csv`,
    };
  }

  return {
    isCsv: false,
    summary: {
      totalActiveStudents: totalActive,
      totalActiveMales: totalMales,
      totalActiveFemales: totalFemales,
      genderRatio: totalActive > 0 ? `${Math.round((totalMales / totalActive) * 100)}% Male / ${Math.round((totalFemales / totalActive) * 100)}% Female` : "N/A",
    },
    classBreakdown: classBreakdown.map((c) => ({
      classId: c.class_id,
      className: c.class_name,
      classSection: c.class_section,
      totalStudents: Number(c.total_students),
      activeStudents: Number(c.active_students),
      activeMales: Number(c.active_males),
      activeFemales: Number(c.active_females),
      inactiveStudents: Number(c.inactive_students),
      leftStudents: Number(c.left_students),
    })),
    monthlyFlow,
  };
}

/**
 * 5. GET /reports/income-vs-teacher-salary?year=
 * Monthly collected fees compared with total active teacher salaries.
 *
 * @param {number} academyId
 * @param {object} filters
 * @returns {Promise<object>}
 */
export async function getIncomeVsSalaryReport(academyId, filters) {
  const current = getCurrentYearMonthKarachi();
  const targetYear = filters.year ? Number(filters.year) : current.year;
  const { format = "json" } = filters;

  // 1. Monthly fee collection
  const incomeRows = await query(
    `SELECT 
       MONTH(paid_on) AS pay_month,
       COALESCE(SUM(amount), 0) AS total_income
     FROM payments
     WHERE academy_id = :academyId AND YEAR(paid_on) = :targetYear
     GROUP BY MONTH(paid_on)`,
    { academyId, targetYear }
  );
  const incomeMap = new Map(incomeRows.map((r) => [Number(r.pay_month), Number(r.total_income)]));

  // 2. Active teacher monthly salaries bill
  const teacherRows = await query(
    `SELECT 
       COALESCE(SUM(salary), 0) AS total_monthly_salaries,
       COUNT(*) AS teacher_count
     FROM teachers
     WHERE academy_id = :academyId AND is_active = TRUE`,
    { academyId }
  );
  const monthlySalaryBill = Number(teacherRows[0]?.total_monthly_salaries || 0);
  const teacherCount = Number(teacherRows[0]?.teacher_count || 0);

  // 3. Build 12-month comparison
  let annualIncome = 0;
  let annualSalaries = 0;

  const monthlyData = [];
  for (let m = 1; m <= 12; m++) {
    const inc = incomeMap.get(m) || 0;
    const sal = monthlySalaryBill;
    const profit = inc - sal;
    const margin = inc > 0 ? Math.round((profit / inc) * 1000) / 10 : 0;

    annualIncome += inc;
    annualSalaries += sal;

    monthlyData.push({
      month: m,
      monthName: getMonthName(m),
      income: inc,
      teacherSalaries: sal,
      netProfit: profit,
      marginPercent: margin,
    });
  }

  const annualNetProfit = annualIncome - annualSalaries;
  const annualMargin = annualIncome > 0 ? Math.round((annualNetProfit / annualIncome) * 1000) / 10 : 0;

  if (format === "csv") {
    const headers = [
      "Month",
      "Fee Income (PKR)",
      "Teacher Salaries (PKR)",
      "Net Profit / Loss (PKR)",
      "Profit Margin %",
    ];
    const lines = [headers.join(",")];
    for (const d of monthlyData) {
      lines.push(
        [
          escapeCsv(d.monthName),
          d.income,
          d.teacherSalaries,
          d.netProfit,
          `${d.marginPercent}%`,
        ].join(",")
      );
    }
    lines.push(['"ANNUAL TOTAL"', annualIncome, annualSalaries, annualNetProfit, `${annualMargin}%`].join(","));

    return {
      isCsv: true,
      csv: lines.join("\r\n"),
      filename: `income-vs-salaries-${targetYear}.csv`,
    };
  }

  return {
    isCsv: false,
    year: targetYear,
    activeTeachersCount: teacherCount,
    monthlySalaryBill,
    annualSummary: {
      annualIncome,
      annualSalaries,
      annualNetProfit,
      annualMarginPercent: annualMargin,
    },
    monthlyData,
  };
}

/**
 * 6. GET /reports/class-performance?examId=&classId=
 * Class and subject performance breakdown for examination results.
 *
 * @param {number} academyId
 * @param {object} filters
 * @returns {Promise<object>}
 */
export async function getClassPerformanceReport(academyId, filters) {
  const { examId, classId, format = "json" } = filters;

  let targetExamId = examId;
  if (!targetExamId) {
    const latestExam = await query(
      `SELECT id FROM exams 
       WHERE academy_id = :academyId AND status = 'published' 
       ORDER BY start_date DESC LIMIT 1`,
      { academyId }
    );
    if (!latestExam || latestExam.length === 0) {
      return {
        isCsv: false,
        message: "No published examinations found for performance reporting.",
        exams: [],
      };
    }
    targetExamId = latestExam[0].id;
  }

  // Fetch exam info
  const exams = await query(
    `SELECT e.*, c.name AS class_name
     FROM exams e
     JOIN classes c ON e.class_id = c.id
     WHERE e.id = :targetExamId AND e.academy_id = :academyId LIMIT 1`,
    { targetExamId, academyId }
  );
  if (!exams || exams.length === 0) {
    throw ApiError.notFound("Examination record not found.");
  }
  const exam = exams[0];

  // Subject statistics
  const subjectStats = await query(
    `SELECT 
       es.id AS exam_subject_id,
       sub.id AS subject_id,
       sub.name AS subject_name,
       es.total_marks,
       es.passing_marks,
       COUNT(m.id) AS evaluated_students,
       COALESCE(AVG(CASE WHEN m.is_absent = FALSE THEN m.marks_obtained END), 0) AS average_marks,
       COALESCE(MAX(CASE WHEN m.is_absent = FALSE THEN m.marks_obtained END), 0) AS highest_marks,
       COALESCE(MIN(CASE WHEN m.is_absent = FALSE THEN m.marks_obtained END), 0) AS lowest_marks,
       COUNT(CASE WHEN m.is_absent = FALSE AND m.marks_obtained >= es.passing_marks THEN 1 END) AS passed_count,
       COUNT(CASE WHEN m.is_absent = TRUE OR m.marks_obtained < es.passing_marks THEN 1 END) AS failed_count
     FROM exam_subjects es
     JOIN subjects sub ON es.subject_id = sub.id
     LEFT JOIN marks m ON m.exam_subject_id = es.id
     WHERE es.exam_id = :targetExamId
     GROUP BY es.id, sub.id, sub.name, es.total_marks, es.passing_marks
     ORDER BY es.id ASC`,
    { targetExamId }
  );

  const subjects = subjectStats.map((s) => {
    const evaluated = Number(s.evaluated_students);
    const passed = Number(s.passed_count);
    const avgMarks = Math.round(Number(s.average_marks) * 10) / 10;
    const avgPct = calculatePercentage(avgMarks, s.total_marks);
    const passRate = evaluated > 0 ? Math.round((passed / evaluated) * 1000) / 10 : 0;

    return {
      examSubjectId: s.exam_subject_id,
      subjectId: s.subject_id,
      subjectName: s.subject_name,
      totalMarks: s.total_marks,
      passingMarks: s.passing_marks,
      evaluatedStudents: evaluated,
      averageMarks: avgMarks,
      averagePercentage: avgPct,
      highestMarks: Number(s.highest_marks),
      lowestMarks: Number(s.lowest_marks),
      passedCount: passed,
      failedCount: Number(s.failed_count),
      passRate,
    };
  });

  if (format === "csv") {
    const headers = [
      "Subject",
      "Total Marks",
      "Passing Marks",
      "Evaluated Students",
      "Average Marks",
      "Average %",
      "Highest Marks",
      "Lowest Marks",
      "Passed Count",
      "Failed Count",
      "Pass Rate %",
    ];
    const lines = [headers.join(",")];
    for (const s of subjects) {
      lines.push(
        [
          escapeCsv(s.subjectName),
          s.totalMarks,
          s.passingMarks,
          s.evaluatedStudents,
          s.averageMarks,
          `${s.averagePercentage}%`,
          s.highestMarks,
          s.lowestMarks,
          s.passedCount,
          s.failedCount,
          `${s.passRate}%`,
        ].join(",")
      );
    }

    return {
      isCsv: true,
      csv: lines.join("\r\n"),
      filename: `class-performance-${exam.name.replace(/[^a-zA-Z0-9_-]/g, "_")}.csv`,
    };
  }

  return {
    isCsv: false,
    exam: {
      id: exam.id,
      name: exam.name,
      examType: exam.exam_type,
      startDate: exam.start_date,
      sessionLabel: exam.session_label,
      className: exam.class_name,
    },
    subjects,
  };
}

export default {
  getFeeCollectionReport,
  getOutstandingReport,
  getAttendanceSummaryReport,
  getStudentStrengthReport,
  getIncomeVsSalaryReport,
  getClassPerformanceReport,
};
