import { query } from "../config/db.js";
import ApiError from "../utils/ApiError.js";
import { assertParentOwnsStudent } from "../utils/parent.security.js";
import {
  getCurrentYearMonthKarachi,
  getTodayDateKarachi,
  calculateAttendancePercentage,
} from "../utils/attendance.js";
import { calculateFeeStatus, calculateBalance, getMonthName } from "../utils/fee.js";
import { calculatePercentage, calculateGrade, isSubjectPassed } from "../utils/grade.js";
import { formatPakistaniPhone } from "../utils/phone.js";

/**
 * 1. List all children linked to the logged-in parent.
 * Includes current month attendance %, pending fee, and latest published exam result %.
 *
 * @param {number} parentId
 * @param {number} academyId
 * @returns {Promise<Array<object>>}
 */
export async function getChildrenList(parentId, academyId) {
  const { year: curYear, month: curMonth } = getCurrentYearMonthKarachi();

  // 1. Fetch children
  const children = await query(
    `SELECT 
       s.id,
       s.name,
       s.roll_no,
       s.photo_url,
       s.monthly_fee,
       s.discount,
       s.status,
       c.id AS class_id,
       c.name AS class_name,
       c.section AS class_section
     FROM parent_students ps
     JOIN students s ON ps.student_id = s.id
     JOIN classes c ON s.class_id = c.id
     WHERE ps.parent_user_id = :parentId
       AND s.academy_id = :academyId
       AND s.deleted_at IS NULL
     ORDER BY s.id ASC`,
    { parentId: Number(parentId), academyId: Number(academyId) }
  );

  if (children.length === 0) {
    return [];
  }

  const results = [];

  for (const child of children) {
    const studentId = child.id;

    // 2. Attendance this month
    const attRows = await query(
      `SELECT 
         COUNT(*) AS total_days,
         SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) AS present_days,
         SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) AS late_days,
         SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) AS absent_days
       FROM attendance
       WHERE student_id = :studentId
         AND academy_id = :academyId
         AND MONTH(date) = :curMonth
         AND YEAR(date) = :curYear`,
      { studentId, academyId, curMonth, curYear }
    );
    const att = attRows[0] || { present_days: 0, late_days: 0, absent_days: 0 };
    const attendancePercentage = calculateAttendancePercentage(
      Number(att.present_days || 0),
      Number(att.late_days || 0),
      Number(att.absent_days || 0)
    );

    // 3. Pending Fee (total unpaid across all months)
    const feeRows = await query(
      `SELECT COALESCE(SUM(amount + late_fee - paid_amount), 0) AS total_pending
       FROM fees
       WHERE student_id = :studentId
         AND academy_id = :academyId
         AND paid_amount < (amount + late_fee)`,
      { studentId, academyId }
    );
    const pendingFee = Number(feeRows[0]?.total_pending || 0);

    // 4. Latest published exam result
    const examRows = await query(
      `SELECT e.id AS exam_id, e.name AS exam_name, e.start_date
       FROM exams e
       JOIN exam_subjects es ON es.exam_id = e.id
       JOIN marks m ON m.exam_subject_id = es.id
       WHERE e.academy_id = :academyId
         AND e.class_id = :classId
         AND m.student_id = :studentId
         AND e.status = 'published'
       ORDER BY e.start_date DESC, e.id DESC
       LIMIT 1`,
      { academyId, classId: child.class_id, studentId }
    );

    let latestResult = null;
    if (examRows.length > 0) {
      const latestExam = examRows[0];
      const marksRows = await query(
        `SELECT m.marks_obtained, es.total_marks
         FROM marks m
         JOIN exam_subjects es ON m.exam_subject_id = es.id
         WHERE es.exam_id = :examId AND m.student_id = :studentId`,
        { examId: latestExam.exam_id, studentId }
      );

      let totalMax = 0;
      let totalObt = 0;
      for (const mr of marksRows) {
        totalMax += Number(mr.total_marks);
        totalObt += Number(mr.marks_obtained || 0);
      }
      const pct = calculatePercentage(totalObt, totalMax);
      latestResult = {
        examId: latestExam.exam_id,
        examName: latestExam.exam_name,
        percentage: pct,
        grade: calculateGrade(pct),
      };
    }

    results.push({
      id: child.id,
      name: child.name,
      rollNo: child.roll_no,
      photoUrl: child.photo_url,
      className: child.class_name,
      classSection: child.class_section,
      status: child.status,
      attendancePercentageThisMonth: attendancePercentage,
      pendingFee,
      latestResult,
    });
  }

  return results;
}

/**
 * 2. Header summary data for a single child.
 *
 * @param {number} parentId
 * @param {number} studentId
 * @param {number} academyId
 * @returns {Promise<object>}
 */
export async function getChildSummary(parentId, studentId, academyId) {
  const student = await assertParentOwnsStudent(parentId, studentId, academyId);
  const { year: curYear, month: curMonth } = getCurrentYearMonthKarachi();

  // 1. Current month attendance
  const attRows = await query(
    `SELECT 
       COUNT(*) AS total_marked,
       SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) AS present_count,
       SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) AS late_count,
       SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) AS absent_count,
       SUM(CASE WHEN status = 'leave' THEN 1 ELSE 0 END) AS leave_count
     FROM attendance
     WHERE student_id = :studentId
       AND academy_id = :academyId
       AND MONTH(date) = :curMonth
       AND YEAR(date) = :curYear`,
    { studentId: student.id, academyId, curMonth, curYear }
  );
  const att = attRows[0] || {};
  const present = Number(att.present_count || 0);
  const late = Number(att.late_count || 0);
  const absent = Number(att.absent_count || 0);
  const leave = Number(att.leave_count || 0);
  const totalMarked = Number(att.total_marked || 0);
  const attendancePercentage = calculateAttendancePercentage(present, late, absent);

  // 2. Fee status (current month and total balance)
  const curFeeRows = await query(
    `SELECT amount, paid_amount, late_fee, due_date, status
     FROM fees
     WHERE student_id = :studentId
       AND academy_id = :academyId
       AND month = :curMonth
       AND year = :curYear
     LIMIT 1`,
    { studentId: student.id, academyId, curMonth, curYear }
  );

  let currentMonthFee = null;
  if (curFeeRows.length > 0) {
    const cf = curFeeRows[0];
    const totalPayable = Number(cf.amount) + Number(cf.late_fee);
    const paid = Number(cf.paid_amount);
    currentMonthFee = {
      month: curMonth,
      monthName: getMonthName(curMonth),
      year: curYear,
      totalPayable,
      paidAmount: paid,
      balance: Math.max(0, totalPayable - paid),
      dueDate: cf.due_date,
      status: calculateFeeStatus(cf.amount, cf.paid_amount, cf.late_fee, cf.due_date),
    };
  }

  const outstandingRes = await query(
    `SELECT COALESCE(SUM(amount + late_fee - paid_amount), 0) AS total_outstanding
     FROM fees
     WHERE student_id = :studentId
       AND academy_id = :academyId
       AND paid_amount < (amount + late_fee)`,
    { studentId: student.id, academyId }
  );
  const totalOutstanding = Number(outstandingRes[0]?.total_outstanding || 0);

  // 3. Latest published exam
  const examRows = await query(
    `SELECT e.id, e.name, e.session_label, e.start_date
     FROM exams e
     JOIN exam_subjects es ON es.exam_id = e.id
     JOIN marks m ON m.exam_subject_id = es.id
     WHERE e.academy_id = :academyId
       AND e.class_id = :classId
       AND m.student_id = :studentId
       AND e.status = 'published'
     ORDER BY e.start_date DESC, e.id DESC
     LIMIT 1`,
    { academyId, classId: student.class_id, studentId: student.id }
  );

  let latestExam = null;
  if (examRows.length > 0) {
    const e = examRows[0];
    const marksRows = await query(
      `SELECT m.marks_obtained, m.is_absent, es.total_marks, es.passing_marks
       FROM marks m
       JOIN exam_subjects es ON m.exam_subject_id = es.id
       WHERE es.exam_id = :examId AND m.student_id = :studentId`,
      { examId: e.id, studentId: student.id }
    );

    let totMax = 0, totObt = 0, anyFail = false;
    for (const mr of marksRows) {
      totMax += Number(mr.total_marks);
      totObt += Number(mr.marks_obtained || 0);
      if (mr.is_absent || Number(mr.marks_obtained || 0) < Number(mr.passing_marks)) {
        anyFail = true;
      }
    }
    const pct = calculatePercentage(totObt, totMax);
    latestExam = {
      examId: e.id,
      name: e.name,
      session: e.session_label,
      percentage: pct,
      grade: calculateGrade(pct),
      status: anyFail ? "fail" : "pass",
    };
  }

  return {
    student: {
      id: student.id,
      name: student.name,
      rollNo: student.roll_no,
      fatherName: student.father_name,
      photoUrl: student.photo_url,
      className: student.class_name,
      classSection: student.class_section,
      classTeacherName: student.class_teacher_name || "Unassigned",
      timingStart: student.timing_start,
      timingEnd: student.timing_end,
      status: student.status,
    },
    attendance: {
      month: curMonth,
      year: curYear,
      percentage: attendancePercentage,
      present,
      absent,
      late,
      leave,
      totalMarked,
    },
    fees: {
      currentMonthFee,
      totalOutstanding,
    },
    latestExam,
  };
}

/**
 * 3. Monthly attendance calendar and totals for one child.
 *
 * @param {number} parentId
 * @param {number} studentId
 * @param {number} academyId
 * @param {{ month?: number, year?: number }} filters
 * @returns {Promise<object>}
 */
export async function getChildAttendance(parentId, studentId, academyId, filters = {}) {
  const student = await assertParentOwnsStudent(parentId, studentId, academyId);
  const current = getCurrentYearMonthKarachi();
  const targetMonth = filters.month ? Number(filters.month) : current.month;
  const targetYear = filters.year ? Number(filters.year) : current.year;

  const records = await query(
    `SELECT 
       date,
       status,
       note
     FROM attendance
     WHERE student_id = :studentId
       AND academy_id = :academyId
       AND MONTH(date) = :targetMonth
       AND YEAR(date) = :targetYear
     ORDER BY date ASC`,
    { studentId: student.id, academyId, targetMonth, targetYear }
  );

  let present = 0, late = 0, absent = 0, leave = 0;
  const formattedRecords = records.map((r) => {
    const dStr = typeof r.date === "string" ? r.date.slice(0, 10) : new Date(r.date).toISOString().slice(0, 10);
    if (r.status === "present") present++;
    if (r.status === "late") late++;
    if (r.status === "absent") absent++;
    if (r.status === "leave") leave++;

    const [y, m, d] = dStr.split("-").map(Number);
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayOfWeek = dayNames[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];

    return {
      date: dStr,
      dayOfWeek,
      status: r.status,
      note: r.note || null,
    };
  });

  const totalMarked = present + late + absent + leave;
  const percentage = calculateAttendancePercentage(present, late, absent);

  return {
    student: {
      id: student.id,
      name: student.name,
      rollNo: student.roll_no,
      className: student.class_name,
    },
    month: targetMonth,
    monthName: getMonthName(targetMonth),
    year: targetYear,
    summary: {
      present,
      late,
      absent,
      leave,
      totalMarked,
      percentage,
    },
    records: formattedRecords,
  };
}

/**
 * 4. Fee ledger with payment transactions, current due, and total outstanding.
 *
 * @param {number} parentId
 * @param {number} studentId
 * @param {number} academyId
 * @returns {Promise<object>}
 */
export async function getChildFees(parentId, studentId, academyId) {
  const student = await assertParentOwnsStudent(parentId, studentId, academyId);
  const { year: curYear, month: curMonth } = getCurrentYearMonthKarachi();
  const todayStr = getTodayDateKarachi();

  // 1. Fetch all fees
  const feeRows = await query(
    `SELECT 
       f.id,
       f.month,
       f.year,
       f.amount,
       f.late_fee,
       f.paid_amount,
       f.due_date,
       f.status
     FROM fees f
     WHERE f.student_id = :studentId
       AND f.academy_id = :academyId
     ORDER BY f.year DESC, f.month DESC`,
    { studentId: student.id, academyId }
  );

  // 2. Fetch all payments for this student
  const paymentRows = await query(
    `SELECT 
       p.id,
       p.fee_id,
       p.receipt_no,
       p.amount,
       p.method,
       p.paid_on
     FROM payments p
     WHERE p.student_id = :studentId
       AND p.academy_id = :academyId
     ORDER BY p.id ASC`,
    { studentId: student.id, academyId }
  );

  const paymentMap = new Map();
  for (const p of paymentRows) {
    if (!paymentMap.has(p.fee_id)) {
      paymentMap.set(p.fee_id, []);
    }
    paymentMap.get(p.fee_id).push({
      id: p.id,
      receiptNo: p.receipt_no,
      amount: p.amount,
      method: p.method,
      paidOn: p.paid_on,
    });
  }

  let totalOutstanding = 0;
  let currentDueAmount = 0;

  const fees = feeRows.map((f) => {
    const totalPayable = Number(f.amount) + Number(f.late_fee);
    const paid = Number(f.paid_amount);
    const balance = Math.max(0, totalPayable - paid);
    const status = calculateFeeStatus(f.amount, f.paid_amount, f.late_fee, f.due_date);
    const isOverdue = status === "overdue";

    totalOutstanding += balance;
    if (f.month === curMonth && f.year === curYear) {
      currentDueAmount = balance;
    }

    return {
      feeId: f.id,
      month: f.month,
      monthName: getMonthName(f.month),
      year: f.year,
      amount: f.amount,
      lateFee: f.late_fee,
      totalPayable,
      paidAmount: paid,
      balance,
      dueDate: f.due_date,
      status,
      isOverdue,
      payments: paymentMap.get(f.id) || [],
    };
  });

  return {
    student: {
      id: student.id,
      name: student.name,
      rollNo: student.roll_no,
      className: student.class_name,
    },
    currentDueAmount,
    totalOutstanding,
    fees,
  };
}

/**
 * 5. Official fee receipt data for paid or partial invoices.
 *
 * @param {number} parentId
 * @param {number} studentId
 * @param {number} feeId
 * @param {number} academyId
 * @returns {Promise<object>}
 */
export async function getChildFeeReceipt(parentId, studentId, feeId, academyId) {
  const student = await assertParentOwnsStudent(parentId, studentId, academyId);

  const feeRows = await query(
    `SELECT * FROM fees 
     WHERE id = :feeId AND student_id = :studentId AND academy_id = :academyId LIMIT 1`,
    { feeId: Number(feeId), studentId: student.id, academyId }
  );

  if (!feeRows || feeRows.length === 0) {
    throw ApiError.notFound("Fee invoice record not found.");
  }

  const fee = feeRows[0];
  if (Number(fee.paid_amount) <= 0) {
    throw ApiError.badRequest("No payment has been recorded for this fee invoice yet.");
  }

  // Fetch academy branding
  const academyRows = await query(
    `SELECT name, address, city, phone, email, logo_url FROM academies WHERE id = :academyId LIMIT 1`,
    { academyId }
  );
  const academy = academyRows[0] || {};

  // Fetch payments
  const payments = await query(
    `SELECT p.id, p.receipt_no, p.amount, p.method, p.paid_on, u.name AS received_by_name
     FROM payments p
     LEFT JOIN users u ON p.received_by = u.id
     WHERE p.fee_id = :feeId AND p.academy_id = :academyId
     ORDER BY p.id ASC`,
    { feeId: fee.id, academyId }
  );

  const totalPayable = Number(fee.amount) + Number(fee.late_fee);
  const paid = Number(fee.paid_amount);
  const balance = Math.max(0, totalPayable - paid);

  return {
    academy: {
      name: academy.name,
      address: academy.address,
      city: academy.city,
      phone: academy.phone ? formatPakistaniPhone(academy.phone) : null,
      email: academy.email,
      logoUrl: academy.logo_url,
    },
    student: {
      id: student.id,
      name: student.name,
      rollNo: student.roll_no,
      fatherName: student.father_name,
      className: student.class_name,
      classSection: student.class_section,
    },
    invoice: {
      feeId: fee.id,
      month: fee.month,
      monthName: getMonthName(fee.month),
      year: fee.year,
      amount: fee.amount,
      lateFee: fee.late_fee,
      totalPayable,
      paidAmount: paid,
      balance,
      dueDate: fee.due_date,
      status: calculateFeeStatus(fee.amount, fee.paid_amount, fee.late_fee, fee.due_date),
    },
    payments: payments.map((p) => ({
      id: p.id,
      receiptNo: p.receipt_no,
      amount: p.amount,
      method: p.method,
      paidOn: p.paid_on,
      receivedBy: p.received_by_name || "System",
    })),
  };
}

/**
 * 6. Published exam results with subject-wise scores and progression.
 *
 * @param {number} parentId
 * @param {number} studentId
 * @param {number} academyId
 * @returns {Promise<object>}
 */
export async function getChildResults(parentId, studentId, academyId) {
  const student = await assertParentOwnsStudent(parentId, studentId, academyId);

  // Fetch published exams for this student's class
  const exams = await query(
    `SELECT DISTINCT 
       e.id,
       e.name,
       e.exam_type,
       e.session_label,
       e.start_date
     FROM exams e
     JOIN exam_subjects es ON es.exam_id = e.id
     JOIN marks m ON m.exam_subject_id = es.id
     WHERE e.academy_id = :academyId
       AND e.class_id = :classId
       AND m.student_id = :studentId
       AND e.status = 'published'
     ORDER BY e.start_date DESC, e.id DESC`,
    { academyId, classId: student.class_id, studentId: student.id }
  );

  const results = [];

  for (const e of exams) {
    const marksRows = await query(
      `SELECT 
         sub.name AS subject_name,
         es.total_marks,
         es.passing_marks,
         m.marks_obtained,
         m.is_absent
       FROM exam_subjects es
       JOIN subjects sub ON es.subject_id = sub.id
       LEFT JOIN marks m ON m.exam_subject_id = es.id AND m.student_id = :studentId
       WHERE es.exam_id = :examId
       ORDER BY es.id ASC`,
      { examId: e.id, studentId: student.id }
    );

    let totMax = 0, totObt = 0, anyFail = false;
    const subjects = marksRows.map((mr) => {
      const max = Number(mr.total_marks);
      const obt = Number(mr.marks_obtained || 0);
      const pass = Number(mr.passing_marks);
      const isAbsent = Boolean(mr.is_absent);
      const isPassed = !isAbsent && isSubjectPassed(obt, pass);
      if (!isPassed) anyFail = true;

      totMax += max;
      totObt += obt;

      return {
        subjectName: mr.subject_name,
        totalMarks: max,
        passingMarks: pass,
        marksObtained: obt,
        isAbsent,
        percentage: calculatePercentage(obt, max),
        grade: calculateGrade(calculatePercentage(obt, max)),
        isPassed,
      };
    });

    const overallPct = calculatePercentage(totObt, totMax);
    const overallGrade = calculateGrade(overallPct);
    const resultStatus = anyFail ? "fail" : "pass";

    // Class position (dense ranking)
    const positionRows = await query(
      `SELECT 
         m.student_id,
         COALESCE(SUM(m.marks_obtained), 0) AS total_score
       FROM marks m
       JOIN exam_subjects es ON m.exam_subject_id = es.id
       WHERE es.exam_id = :examId
       GROUP BY m.student_id
       ORDER BY total_score DESC`,
      { examId: e.id }
    );

    let position = 1;
    let rank = 1;
    for (let i = 0; i < positionRows.length; i++) {
      if (i > 0 && positionRows[i].total_score < positionRows[i - 1].total_score) {
        rank++;
      }
      if (Number(positionRows[i].student_id) === Number(student.id)) {
        position = rank;
        break;
      }
    }

    results.push({
      examId: e.id,
      examName: e.name,
      examType: e.exam_type,
      sessionLabel: e.session_label,
      startDate: e.start_date,
      totalMarks: totMax,
      obtainedMarks: totObt,
      percentage: overallPct,
      grade: overallGrade,
      position,
      totalStudentsInClass: positionRows.length,
      resultStatus,
      subjects,
    });
  }

  return {
    student: {
      id: student.id,
      name: student.name,
      rollNo: student.roll_no,
      className: student.class_name,
      classSection: student.class_section,
    },
    results,
  };
}

/**
 * 7. Detailed Report Card for one child and one exam.
 *
 * @param {number} parentId
 * @param {number} studentId
 * @param {number} examId
 * @param {number} academyId
 * @returns {Promise<object>}
 */
export async function getChildReportCard(parentId, studentId, examId, academyId) {
  const student = await assertParentOwnsStudent(parentId, studentId, academyId);

  const examRows = await query(
    `SELECT * FROM exams 
     WHERE id = :examId AND academy_id = :academyId AND status = 'published' LIMIT 1`,
    { examId: Number(examId), academyId }
  );

  if (!examRows || examRows.length === 0) {
    throw ApiError.notFound("Exam record not found or results have not been published yet.");
  }
  const exam = examRows[0];

  // Academy branding
  const academyRows = await query(
    `SELECT name, address, city, phone, email, logo_url FROM academies WHERE id = :academyId LIMIT 1`,
    { academyId }
  );
  const academy = academyRows[0] || {};

  // Subject marks
  const marksRows = await query(
    `SELECT 
       sub.name AS subject_name,
       es.total_marks,
       es.passing_marks,
       m.marks_obtained,
       m.is_absent
     FROM exam_subjects es
     JOIN subjects sub ON es.subject_id = sub.id
     LEFT JOIN marks m ON m.exam_subject_id = es.id AND m.student_id = :studentId
     WHERE es.exam_id = :examId
     ORDER BY es.id ASC`,
    { examId: exam.id, studentId: student.id }
  );

  let totMax = 0, totObt = 0, anyFail = false;
  const subjects = marksRows.map((mr) => {
    const max = Number(mr.total_marks);
    const obt = Number(mr.marks_obtained || 0);
    const pass = Number(mr.passing_marks);
    const isAbsent = Boolean(mr.is_absent);
    const isPassed = !isAbsent && isSubjectPassed(obt, pass);
    if (!isPassed) anyFail = true;

    totMax += max;
    totObt += obt;

    return {
      subjectName: mr.subject_name,
      totalMarks: max,
      passingMarks: pass,
      marksObtained: obt,
      isAbsent,
      percentage: calculatePercentage(obt, max),
      grade: calculateGrade(calculatePercentage(obt, max)),
      isPassed,
    };
  });

  const overallPct = calculatePercentage(totObt, totMax);
  const overallGrade = calculateGrade(overallPct);

  // Position
  const positionRows = await query(
    `SELECT 
       m.student_id,
       COALESCE(SUM(m.marks_obtained), 0) AS total_score
     FROM marks m
     JOIN exam_subjects es ON m.exam_subject_id = es.id
     WHERE es.exam_id = :examId
     GROUP BY m.student_id
     ORDER BY total_score DESC`,
    { examId: exam.id }
  );

  let position = 1;
  let rank = 1;
  for (let i = 0; i < positionRows.length; i++) {
    if (i > 0 && positionRows[i].total_score < positionRows[i - 1].total_score) {
      rank++;
    }
    if (Number(positionRows[i].student_id) === Number(student.id)) {
      position = rank;
      break;
    }
  }

  // Teacher Remarks
  const remarkRows = await query(
    `SELECT remark FROM report_remarks 
     WHERE exam_id = :examId AND student_id = :studentId LIMIT 1`,
    { examId: exam.id, studentId: student.id }
  );
  const teacherRemark = remarkRows[0]?.remark || null;

  return {
    academy: {
      name: academy.name,
      address: academy.address,
      city: academy.city,
      phone: academy.phone ? formatPakistaniPhone(academy.phone) : null,
      email: academy.email,
      logoUrl: academy.logo_url,
    },
    student: {
      id: student.id,
      name: student.name,
      rollNo: student.roll_no,
      fatherName: student.father_name,
      className: student.class_name,
      classSection: student.class_section,
    },
    exam: {
      id: exam.id,
      name: exam.name,
      examType: exam.exam_type,
      sessionLabel: exam.session_label,
      startDate: exam.start_date,
    },
    summary: {
      totalMarks: totMax,
      obtainedMarks: totObt,
      percentage: overallPct,
      grade: overallGrade,
      classPosition: position,
      totalStudentsInClass: positionRows.length,
      resultStatus: anyFail ? "fail" : "pass",
      teacherRemark,
    },
    subjects,
  };
}

/**
 * 8. Notices for 'all', 'parents', and the parent's children's classes.
 * Includes isRead flag and pinned notices first.
 *
 * @param {number} parentId
 * @param {number} academyId
 * @returns {Promise<Array<object>>}
 */
export async function getParentNotices(parentId, academyId) {
  // 1. Get class IDs of the parent's children
  const classRows = await query(
    `SELECT DISTINCT s.class_id 
     FROM parent_students ps
     JOIN students s ON ps.student_id = s.id
     WHERE ps.parent_user_id = :parentId
       AND s.academy_id = :academyId
       AND s.deleted_at IS NULL`,
    { parentId: Number(parentId), academyId: Number(academyId) }
  );

  const classIds = classRows.map((r) => r.class_id);
  const classFilterSql = classIds.length > 0 ? `OR (n.audience = 'class' AND n.class_id IN (${classIds.join(",")}))` : "";

  const notices = await query(
    `SELECT 
       n.id,
       n.title,
       n.body,
       n.audience,
       n.class_id,
       c.name AS class_name,
       n.is_pinned,
       n.created_at,
       nr.read_at,
       u.name AS author_name
     FROM notices n
     LEFT JOIN classes c ON n.class_id = c.id
     LEFT JOIN users u ON n.created_by = u.id
     LEFT JOIN notice_reads nr ON nr.notice_id = n.id AND nr.user_id = :parentId
     WHERE n.academy_id = :academyId
       AND (n.audience IN ('all', 'parents') ${classFilterSql})
     ORDER BY n.is_pinned DESC, n.created_at DESC`,
    { parentId: Number(parentId), academyId: Number(academyId) }
  );

  return notices.map((n) => ({
    id: n.id,
    title: n.title,
    body: n.body,
    audience: n.audience,
    classId: n.class_id,
    className: n.class_name,
    isPinned: Boolean(n.is_pinned),
    isRead: Boolean(n.read_at),
    readAt: n.read_at || null,
    authorName: n.author_name || "Academy Staff",
    createdAt: n.created_at,
  }));
}

/**
 * 9. Mark a notice as read by the parent.
 *
 * @param {number} parentId
 * @param {number} noticeId
 * @param {number} academyId
 * @returns {Promise<{ message: string, readAt: string }>}
 */
export async function markNoticeRead(parentId, noticeId, academyId) {
  // Verify notice exists in this academy
  const rows = await query(
    `SELECT id FROM notices WHERE id = :noticeId AND academy_id = :academyId LIMIT 1`,
    { noticeId: Number(noticeId), academyId: Number(academyId) }
  );

  if (!rows || rows.length === 0) {
    throw ApiError.notFound("Notice record not found.");
  }

  await query(
    `INSERT INTO notice_reads (notice_id, user_id, read_at)
     VALUES (:noticeId, :parentId, NOW())
     ON DUPLICATE KEY UPDATE read_at = NOW()`,
    { noticeId: Number(noticeId), parentId: Number(parentId) }
  );

  return {
    message: "Notice marked as read.",
    noticeId: Number(noticeId),
    readAt: new Date().toISOString(),
  };
}

/**
 * 10. Academy contact information and WhatsApp direct link for parents.
 *
 * @param {number} academyId
 * @returns {Promise<object>}
 */
export async function getAcademyContact(academyId) {
  const rows = await query(
    `SELECT name, phone, email, address, city, logo_url FROM academies WHERE id = :academyId LIMIT 1`,
    { academyId: Number(academyId) }
  );

  if (!rows || rows.length === 0) {
    throw ApiError.notFound("Academy profile not found.");
  }

  const academy = rows[0];
  const rawPhone = academy.phone ? String(academy.phone).replace(/[^0-9]/g, "") : "";
  let cleanPhone = rawPhone;
  if (cleanPhone.startsWith("0")) {
    cleanPhone = "92" + cleanPhone.slice(1);
  }

  const whatsAppLink = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hello ${academy.name}, I am a parent contacting regarding my child.`)}`
    : null;

  return {
    name: academy.name,
    phone: academy.phone ? formatPakistaniPhone(academy.phone) : null,
    email: academy.email,
    address: academy.address,
    city: academy.city,
    logoUrl: academy.logo_url,
    whatsAppLink,
  };
}

export default {
  assertParentOwnsStudent,
  getChildrenList,
  getChildSummary,
  getChildAttendance,
  getChildFees,
  getChildFeeReceipt,
  getChildResults,
  getChildReportCard,
  getParentNotices,
  markNoticeRead,
  getAcademyContact,
};
