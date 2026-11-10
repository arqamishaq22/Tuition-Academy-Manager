import { query, withTransaction } from "../config/db.js";
import ApiError from "../utils/ApiError.js";
import messagingService from "./messaging/index.js";
import { getMonthName, calculateFeeStatus, calculateBalance } from "../utils/fee.js";
import { formatPakistaniPhone, toInternationalPakistaniPhone } from "../utils/phone.js";
import { getTodayDateKarachi, getCurrentYearMonthKarachi } from "../utils/attendance.js";
import { calculatePercentage, calculateGrade, isSubjectPassed } from "../utils/grade.js";

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
 * 1. POST /reminders/fees/preview
 * Previews personalized WhatsApp fee reminder links for matching unpaid fees.
 *
 * @param {number} academyId
 * @param {object} options
 * @returns {Promise<Array<object>>}
 */
export async function previewFeeReminders(academyId, options = {}) {
  const { feeIds, month, year, classId, status } = options;

  // 1. Fetch academy template and name
  const academyRows = await query(
    `SELECT name, reminder_template FROM academies WHERE id = :academyId LIMIT 1`,
    { academyId }
  );
  if (!academyRows || academyRows.length === 0) {
    throw ApiError.notFound("Academy profile not found.");
  }
  const academy = academyRows[0];
  const template =
    academy.reminder_template ||
    "Dear Parent, fee of Rs {amount} for {student} is due on {dueDate}. Please clear dues for {month}. - {academy}";

  // 2. Build fee query
  let whereClauses = [
    "f.academy_id = :academyId",
    "s.deleted_at IS NULL",
    "s.status = 'active'",
    "(f.amount + f.late_fee) > f.paid_amount",
  ];
  const params = { academyId };

  if (feeIds && Array.isArray(feeIds) && feeIds.length > 0) {
    whereClauses.push(`f.id IN (${feeIds.map((id) => Number(id)).join(",")})`);
  } else {
    if (month) {
      whereClauses.push("f.month = :month");
      params.month = Number(month);
    }
    if (year) {
      whereClauses.push("f.year = :year");
      params.year = Number(year);
    }
    if (classId) {
      whereClauses.push("s.class_id = :classId");
      params.classId = Number(classId);
    }
  }

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
      s.id AS student_id,
      s.name AS student_name,
      s.roll_no,
      s.parent_phone,
      c.name AS class_name
    FROM fees f
    JOIN students s ON f.student_id = s.id
    JOIN classes c ON s.class_id = c.id
    WHERE ${whereClauses.join(" AND ")}
    ORDER BY f.due_date ASC, s.name ASC
  `;

  const rows = await query(sql, params);

  // Filter by computed status if requested
  const filteredRows = rows.filter((r) => {
    if (!status || status === "all") return true;
    const computed = calculateFeeStatus(r.amount, r.paid_amount, r.late_fee, r.due_date);
    return computed === status;
  });

  const previews = [];

  for (const r of filteredRows) {
    const balance = Number(r.balance);
    const monthName = getMonthName(r.month);

    const message = renderTemplate(template, {
      student: r.student_name,
      amount: balance.toLocaleString("en-PK"),
      dueDate: r.due_date,
      month: monthName,
      academy: academy.name,
    });

    const waLink = messagingService.generateLink(r.parent_phone, message);

    // Check if reminder was sent in the last 24 hours
    const recentSent = await query(
      `SELECT id, sent_at FROM reminder_logs 
       WHERE academy_id = :academyId 
         AND student_id = :studentId 
         AND fee_id = :feeId 
         AND status = 'sent' 
         AND sent_at >= NOW() - INTERVAL 24 HOUR 
       ORDER BY id DESC LIMIT 1`,
      { academyId, studentId: r.student_id, feeId: r.fee_id }
    );

    const hasRecent = recentSent && recentSent.length > 0;

    previews.push({
      feeId: r.fee_id,
      studentId: r.student_id,
      studentName: r.student_name,
      rollNo: r.roll_no,
      className: r.class_name,
      parentPhone: r.parent_phone,
      formattedPhone: formatPakistaniPhone(r.parent_phone),
      internationalPhone: toInternationalPakistaniPhone(r.parent_phone),
      balance,
      dueDate: r.due_date,
      month: r.month,
      monthName,
      year: r.year,
      message,
      waLink,
      sentWithin24h: hasRecent,
      lastSentAt: hasRecent ? recentSent[0].sent_at : null,
    });
  }

  return previews;
}

/**
 * 2. POST /reminders/fees/send
 * Marks selected reminders as 'sent' in reminder_logs and returns ready wa.me links.
 * 24-hour rate limit guard prevents spamming parents unless force=true.
 *
 * @param {number} academyId
 * @param {object} body
 * @returns {Promise<object>}
 */
export async function sendFeeReminders(academyId, body = {}) {
  const { feeIds, force = false } = body;

  const previews = await previewFeeReminders(academyId, { feeIds });

  const sent = [];
  const skipped = [];

  for (const item of previews) {
    if (item.sentWithin24h && !force) {
      skipped.push({
        feeId: item.feeId,
        studentName: item.studentName,
        parentPhone: item.parentPhone,
        reason: "Reminder already sent within the last 24 hours. Use force=true to override.",
        lastSentAt: item.lastSentAt,
      });
      continue;
    }

    // Record in reminder_logs
    await query(
      `INSERT INTO reminder_logs (academy_id, student_id, recipient_phone, fee_id, channel, message, status, sent_at)
       VALUES (:academyId, :studentId, :recipientPhone, :feeId, 'whatsapp', :message, 'sent', NOW())`,
      {
        academyId,
        studentId: item.studentId,
        recipientPhone: toInternationalPakistaniPhone(item.parentPhone),
        feeId: item.feeId,
        message: item.message,
      }
    );

    sent.push({
      feeId: item.feeId,
      studentId: item.studentId,
      studentName: item.studentName,
      parentPhone: item.parentPhone,
      message: item.message,
      waLink: item.waLink,
    });
  }

  return {
    sentCount: sent.length,
    skippedCount: skipped.length,
    sent,
    skipped,
  };
}

/**
 * 3. POST /reminders/absent
 * Builds personalized absent-student alert messages for a specific date and class.
 *
 * @param {number} academyId
 * @param {object} options
 * @returns {Promise<Array<object>>}
 */
export async function previewAbsentReminders(academyId, options = {}) {
  const date = options.date || getTodayDateKarachi();
  const classId = options.classId ? Number(options.classId) : null;

  const academyRows = await query(
    `SELECT name FROM academies WHERE id = :academyId LIMIT 1`,
    { academyId }
  );
  const academyName = academyRows[0]?.name || "Tuition Academy";

  let sql = `
    SELECT 
      a.id AS attendance_id,
      a.date,
      a.status,
      s.id AS student_id,
      s.name AS student_name,
      s.roll_no,
      s.parent_phone,
      c.id AS class_id,
      c.name AS class_name
    FROM attendance a
    JOIN students s ON a.student_id = s.id
    JOIN classes c ON a.class_id = c.id
    WHERE a.academy_id = :academyId
      AND a.date = :date
      AND a.status = 'absent'
      AND s.deleted_at IS NULL
  `;
  const params = { academyId, date };

  if (classId) {
    sql += ` AND a.class_id = :classId`;
    params.classId = classId;
  }

  sql += ` ORDER BY c.name ASC, s.name ASC`;

  const rows = await query(sql, params);

  return rows.map((r) => {
    const message = `Respected Parent, your child ${r.student_name} (Roll No: ${r.roll_no}, ${r.class_name}) was marked ABSENT today (${r.date}) at ${academyName}. Please contact the academy if you were unaware of this absence.`;
    const waLink = messagingService.generateLink(r.parent_phone, message);

    return {
      attendanceId: r.attendance_id,
      studentId: r.student_id,
      studentName: r.student_name,
      rollNo: r.roll_no,
      className: r.class_name,
      parentPhone: r.parent_phone,
      date: r.date,
      message,
      waLink,
    };
  });
}

/**
 * 4. POST /reminders/receipt/:paymentId
 * Builds a payment receipt confirmation WhatsApp message with receipt number, amount, and remaining balance.
 *
 * @param {number} academyId
 * @param {number} paymentId
 * @returns {Promise<object>}
 */
export async function buildReceiptReminder(academyId, paymentId) {
  const rows = await query(
    `SELECT 
       p.id AS payment_id,
       p.receipt_no,
       p.amount AS paid_amount,
       p.method,
       p.paid_on,
       f.id AS fee_id,
       f.month,
       f.year,
       f.amount AS fee_amount,
       f.late_fee,
       f.paid_amount AS total_fee_paid,
       (f.amount + f.late_fee - f.paid_amount) AS balance,
       s.id AS student_id,
       s.name AS student_name,
       s.roll_no,
       s.parent_phone,
       c.name AS class_name,
       a.name AS academy_name
     FROM payments p
     JOIN fees f ON p.fee_id = f.id
     JOIN students s ON p.student_id = s.id
     JOIN classes c ON s.class_id = c.id
     JOIN academies a ON p.academy_id = a.id
     WHERE p.id = :paymentId AND p.academy_id = :academyId LIMIT 1`,
    { paymentId: Number(paymentId), academyId }
  );

  if (!rows || rows.length === 0) {
    throw ApiError.notFound("Payment receipt not found.");
  }

  const r = rows[0];
  const balance = Math.max(0, Number(r.balance));
  const monthName = getMonthName(r.month);

  const message = `Payment Receipt Confirmation: Received Rs ${Number(r.paid_amount).toLocaleString("en-PK")} for ${r.student_name} (${r.class_name}) for ${monthName} fee on ${r.paid_on} via ${r.method.toUpperCase()}. Receipt No: ${r.receipt_no}. Remaining Fee Balance: Rs ${balance.toLocaleString("en-PK")}. Thank you, ${r.academy_name}.`;

  const waLink = messagingService.generateLink(r.parent_phone, message);

  // Record in reminder_logs
  await query(
    `INSERT INTO reminder_logs (academy_id, student_id, recipient_phone, fee_id, channel, message, status, sent_at)
     VALUES (:academyId, :studentId, :recipientPhone, :feeId, 'whatsapp', :message, 'sent', NOW())`,
    {
      academyId,
      studentId: r.student_id,
      recipientPhone: toInternationalPakistaniPhone(r.parent_phone),
      feeId: r.fee_id,
      message,
    }
  );

  return {
    paymentId: r.payment_id,
    receiptNo: r.receipt_no,
    studentName: r.student_name,
    parentPhone: r.parent_phone,
    amount: r.paid_amount,
    balance,
    message,
    waLink,
  };
}

/**
 * 5. POST /reminders/result/:examId/:studentId
 * Builds an exam result announcement message.
 *
 * @param {number} academyId
 * @param {number} examId
 * @param {number} studentId
 * @returns {Promise<object>}
 */
export async function buildResultReminder(academyId, examId, studentId) {
  const examRows = await query(
    `SELECT e.*, c.name AS class_name, a.name AS academy_name
     FROM exams e
     JOIN classes c ON e.class_id = c.id
     JOIN academies a ON e.academy_id = a.id
     WHERE e.id = :examId AND e.academy_id = :academyId AND e.status = 'published' LIMIT 1`,
    { examId: Number(examId), academyId }
  );

  if (!examRows || examRows.length === 0) {
    throw ApiError.notFound("Exam record not found or results are not published yet.");
  }
  const exam = examRows[0];

  const studentRows = await query(
    `SELECT id, name, roll_no, parent_phone FROM students 
     WHERE id = :studentId AND academy_id = :academyId AND deleted_at IS NULL LIMIT 1`,
    { studentId: Number(studentId), academyId }
  );

  if (!studentRows || studentRows.length === 0) {
    throw ApiError.notFound("Student record not found.");
  }
  const student = studentRows[0];

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
     WHERE es.exam_id = :examId`,
    { examId: exam.id, studentId: student.id }
  );

  let totMax = 0, totObt = 0, anyFail = false;
  const subjectScores = [];

  for (const mr of marksRows) {
    const max = Number(mr.total_marks);
    const obt = Number(mr.marks_obtained || 0);
    const pass = Number(mr.passing_marks);
    const isAbsent = Boolean(mr.is_absent);
    const isPassed = !isAbsent && isSubjectPassed(obt, pass);
    if (!isPassed) anyFail = true;

    totMax += max;
    totObt += obt;
    subjectScores.push(`${mr.subject_name}: ${isAbsent ? "Absent" : `${obt}/${max}`}`);
  }

  const percentage = calculatePercentage(totObt, totMax);
  const grade = calculateGrade(percentage);
  const status = anyFail ? "FAILED" : "PASSED";

  const message = `Exam Result: ${student.name} (${exam.class_name}) has scored ${totObt}/${totMax} (${percentage}%, Grade: ${grade}, Status: ${status}) in '${exam.name}'. Scores: ${subjectScores.join(", ")}. Full report card is viewable in the Parent Portal. - ${exam.academy_name}`;

  const waLink = messagingService.generateLink(student.parent_phone, message);

  return {
    examId: exam.id,
    examName: exam.name,
    studentId: student.id,
    studentName: student.name,
    parentPhone: student.parent_phone,
    percentage,
    grade,
    status,
    message,
    waLink,
  };
}

/**
 * 6. GET /reminders/logs
 * List dispatched reminders with filters and pagination.
 *
 * @param {number} academyId
 * @param {object} filters
 * @returns {Promise<{ logs: Array<object>, total: number, page: number, limit: number, totalPages: number }>}
 */
export async function getReminderLogs(academyId, filters = {}) {
  const { date, student, status, channel, page = 1, limit = 20 } = filters;
  const offset = (page - 1) * limit;

  let whereClauses = ["rl.academy_id = :academyId"];
  const params = { academyId, limit: Number(limit), offset: Number(offset) };

  if (date) {
    whereClauses.push("DATE(rl.sent_at) = :date");
    params.date = date;
  }
  if (status) {
    whereClauses.push("rl.status = :status");
    params.status = status;
  }
  if (channel) {
    whereClauses.push("rl.channel = :channel");
    params.channel = channel;
  }
  if (student) {
    whereClauses.push("(s.name LIKE :studentSearch OR s.roll_no LIKE :studentSearch OR rl.recipient_phone LIKE :studentSearch)");
    params.studentSearch = `%${student}%`;
  }

  const whereSql = whereClauses.join(" AND ");

  const countRes = await query(
    `SELECT COUNT(*) AS total_count
     FROM reminder_logs rl
     JOIN students s ON rl.student_id = s.id
     WHERE ${whereSql}`,
    params
  );
  const total = Number(countRes[0]?.total_count || 0);

  const rows = await query(
    `SELECT 
       rl.id,
       rl.channel,
       rl.message,
       rl.status,
       rl.sent_at,
       rl.recipient_phone,
       s.id AS student_id,
       s.name AS student_name,
       s.roll_no,
       c.name AS class_name,
       f.id AS fee_id,
       f.month AS fee_month,
       f.year AS fee_year
     FROM reminder_logs rl
     JOIN students s ON rl.student_id = s.id
     JOIN classes c ON s.class_id = c.id
     LEFT JOIN fees f ON rl.fee_id = f.id
     WHERE ${whereSql}
     ORDER BY rl.id DESC
     LIMIT :limit OFFSET :offset`,
    params
  );

  const logs = rows.map((r) => ({
    id: r.id,
    channel: r.channel,
    message: r.message,
    status: r.status,
    sentAt: r.sent_at,
    recipientPhone: r.recipient_phone,
    student: {
      id: r.student_id,
      name: r.student_name,
      rollNo: r.roll_no,
      className: r.class_name,
    },
    fee: r.fee_id
      ? {
          id: r.fee_id,
          month: r.fee_month,
          monthName: getMonthName(r.fee_month),
          year: r.fee_year,
        }
      : null,
  }));

  const totalPages = Math.ceil(total / limit) || 1;

  return {
    logs,
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages,
  };
}

/**
 * 7. GET /reminders/queue
 * List reminders that were queued (e.g. by due-soon cron job).
 *
 * @param {number} academyId
 * @returns {Promise<Array<object>>}
 */
export async function getQueuedReminders(academyId) {
  const rows = await query(
    `SELECT 
       rl.id,
       rl.message,
       rl.recipient_phone,
       rl.sent_at AS queued_at,
       s.id AS student_id,
       s.name AS student_name,
       s.roll_no,
       s.parent_phone,
       c.name AS class_name,
       f.id AS fee_id,
       f.month,
       f.year,
       (f.amount + f.late_fee - f.paid_amount) AS balance,
       f.due_date
     FROM reminder_logs rl
     JOIN students s ON rl.student_id = s.id
     JOIN classes c ON s.class_id = c.id
     LEFT JOIN fees f ON rl.fee_id = f.id
     WHERE rl.academy_id = :academyId AND rl.status = 'queued'
     ORDER BY rl.id ASC`,
    { academyId }
  );

  return rows.map((r) => ({
    reminderId: r.id,
    studentId: r.student_id,
    studentName: r.student_name,
    rollNo: r.roll_no,
    className: r.class_name,
    parentPhone: r.parent_phone,
    feeId: r.fee_id,
    month: r.month,
    year: r.year,
    balance: r.balance,
    dueDate: r.due_date,
    message: r.message,
    queuedAt: r.queued_at,
    waLink: messagingService.generateLink(r.parent_phone || r.recipient_phone, r.message),
  }));
}

/**
 * 8. POST /reminders/queue/send
 * Transitions selected queued reminders to 'sent' status.
 *
 * @param {number} academyId
 * @param {object} body
 * @returns {Promise<object>}
 */
export async function sendQueuedReminders(academyId, body = {}) {
  const { reminderIds } = body;

  let whereClauses = ["academy_id = :academyId", "status = 'queued'"];
  const params = { academyId };

  if (reminderIds && Array.isArray(reminderIds) && reminderIds.length > 0) {
    whereClauses.push(`id IN (${reminderIds.map((id) => Number(id)).join(",")})`);
  }

  // Fetch target queued reminders
  const queued = await query(
    `SELECT id, student_id, recipient_phone, message FROM reminder_logs WHERE ${whereClauses.join(" AND ")}`,
    params
  );

  if (queued.length === 0) {
    return { sentCount: 0, sent: [] };
  }

  const idsToUpdate = queued.map((q) => q.id);
  await query(
    `UPDATE reminder_logs 
     SET status = 'sent', sent_at = NOW() 
     WHERE id IN (${idsToUpdate.join(",")}) AND academy_id = :academyId`,
    { academyId }
  );

  const sent = queued.map((q) => ({
    reminderId: q.id,
    studentId: q.student_id,
    recipientPhone: q.recipient_phone,
    message: q.message,
    waLink: messagingService.generateLink(q.recipient_phone, q.message),
  }));

  return {
    sentCount: sent.length,
    sent,
  };
}

export default {
  previewFeeReminders,
  sendFeeReminders,
  previewAbsentReminders,
  buildReceiptReminder,
  buildResultReminder,
  getReminderLogs,
  getQueuedReminders,
  sendQueuedReminders,
};
