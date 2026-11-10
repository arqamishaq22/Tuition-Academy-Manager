import { query, withTransaction } from "../config/db.js";
import ApiError from "../utils/ApiError.js";
import { clearDashboardCache } from "../utils/cache.js";
import {
  calculateFeeStatus,
  calculateBalance,
  generateReceiptNumber,
  getTodayDateKarachi,
  getCurrentYearMonthKarachi,
  getMonthName,
} from "../utils/fee.js";

/**
 * 1. Bulk generate monthly fees for active students in an academy.
 * Idempotent: Skips students who already have a fee record for the given month and year.
 *
 * @param {number} academyId
 * @param {{ month: number, year: number, classId?: number }} options
 * @returns {Promise<{ created: number, skipped: number, month: number, year: number, dueDate: string }>}
 */
export async function generateMonthlyFees(academyId, { month, year, classId }) {
  // 1. Fetch academy due day settings
  const academies = await query(
    `SELECT fee_due_day, late_fee_enabled, late_fee_amount FROM academies WHERE id = :academyId LIMIT 1`,
    { academyId }
  );

  if (!academies || academies.length === 0) {
    throw ApiError.notFound("Academy not found.");
  }

  const academy = academies[0];
  const dueDaySetting = academy.fee_due_day || 10;
  const daysInMonth = new Date(year, month, 0).getDate();
  const clampedDay = Math.min(dueDaySetting, daysInMonth);
  const dueDateStr = `${year}-${String(month).padStart(2, "0")}-${String(clampedDay).padStart(2, "0")}`;
  const periodEnd = `${year}-${String(month).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;

  // 2. Query active students admitted on or before the end of the target period
  let studentSql = `
    SELECT s.id, s.monthly_fee, s.discount, s.class_id
    FROM students s
    WHERE s.academy_id = :academyId
      AND s.status = 'active'
      AND s.deleted_at IS NULL
      AND s.admission_date <= :periodEnd
  `;
  const studentParams = { academyId, periodEnd };

  if (classId) {
    studentSql += ` AND s.class_id = :classId`;
    studentParams.classId = classId;
  }

  const students = await query(studentSql, studentParams);

  if (students.length === 0) {
    return { created: 0, skipped: 0, month, year, dueDate: dueDateStr };
  }

  // 3. Query existing fee records for this month and year to ensure idempotency
  let existingSql = `SELECT student_id FROM fees WHERE academy_id = :academyId AND month = :month AND year = :year`;
  const existingRows = await query(existingSql, { academyId, month, year });
  const existingSet = new Set(existingRows.map((r) => Number(r.student_id)));

  const studentsToInsert = [];
  let skipped = 0;

  for (const s of students) {
    if (existingSet.has(Number(s.id))) {
      skipped++;
    } else {
      const netAmount = Math.max(0, (Number(s.monthly_fee) || 0) - (Number(s.discount) || 0));
      studentsToInsert.push({
        studentId: s.id,
        amount: netAmount,
      });
    }
  }

  if (studentsToInsert.length === 0) {
    return { created: 0, skipped, month, year, dueDate: dueDateStr };
  }

  // 4. Batch insert fee records in transaction
  await withTransaction(async (conn) => {
    for (const item of studentsToInsert) {
      await conn.query(
        `INSERT INTO fees (academy_id, student_id, month, year, amount, paid_amount, due_date, status, late_fee)
         VALUES (:academyId, :studentId, :month, :year, :amount, 0, :dueDate, 'pending', 0)`,
        {
          academyId,
          studentId: item.studentId,
          month,
          year,
          amount: item.amount,
          dueDate: dueDateStr,
        }
      );
    }
  });

  clearDashboardCache(academyId);

  return {
    created: studentsToInsert.length,
    skipped,
    month,
    year,
    dueDate: dueDateStr,
  };
}

/**
 * 2. List fees with rich filters, sorting, and pagination.
 *
 * @param {number} academyId
 * @param {object} filters
 * @returns {Promise<{ fees: Array, total: number }>}
 */
export async function getFeesList(academyId, filters) {
  const { month, year, classId, status, q, limit = 10, offset = 0, sortBy, order = "DESC" } = filters;

  let whereClauses = ["f.academy_id = :academyId", "s.deleted_at IS NULL"];
  const params = { academyId, limit, offset };

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

  if (q) {
    whereClauses.push("(s.name LIKE :q OR s.roll_no LIKE :q OR s.father_name LIKE :q)");
    params.q = `%${q}%`;
  }

  // Handle status filter dynamically
  if (status && status !== "all") {
    if (status === "paid") {
      whereClauses.push("f.paid_amount >= (f.amount + f.late_fee)");
    } else if (status === "overdue") {
      whereClauses.push("(f.amount + f.late_fee) > f.paid_amount AND f.due_date < CURRENT_DATE()");
    } else if (status === "partial") {
      whereClauses.push("f.paid_amount > 0 AND f.paid_amount < (f.amount + f.late_fee) AND f.due_date >= CURRENT_DATE()");
    } else if (status === "pending") {
      whereClauses.push("f.paid_amount = 0 AND (f.amount + f.late_fee) > 0 AND f.due_date >= CURRENT_DATE()");
    }
  }

  const whereSql = whereClauses.join(" AND ");

  // Count query
  const countSql = `
    SELECT COUNT(f.id) AS total
    FROM fees f
    JOIN students s ON f.student_id = s.id
    WHERE ${whereSql}
  `;
  const countResult = await query(countSql, params);
  const total = countResult[0]?.total || 0;

  // Safe sorting mapping
  const sortMap = {
    student_name: "s.name",
    roll_no: "s.roll_no",
    due_date: "f.due_date",
    amount: "f.amount",
    paid_amount: "f.paid_amount",
    balance: "(f.amount + f.late_fee - f.paid_amount)",
    created_at: "f.created_at",
    status: "f.status",
  };
  const sortColumn = sortMap[sortBy] || "f.id";
  const sortDirection = String(order).toUpperCase() === "ASC" ? "ASC" : "DESC";

  const dataSql = `
    SELECT 
      f.id,
      f.academy_id,
      f.student_id,
      s.name AS student_name,
      s.roll_no,
      s.father_name,
      s.parent_phone,
      s.class_id,
      c.name AS class_name,
      c.section AS class_section,
      f.month,
      f.year,
      f.amount,
      f.paid_amount,
      f.late_fee,
      f.due_date,
      f.created_at,
      f.updated_at
    FROM fees f
    JOIN students s ON f.student_id = s.id
    JOIN classes c ON s.class_id = c.id
    WHERE ${whereSql}
    ORDER BY ${sortColumn} ${sortDirection}
    LIMIT :limit OFFSET :offset
  `;

  const rows = await query(dataSql, params);

  const fees = rows.map((r) => {
    const computedStatus = calculateFeeStatus(r.amount, r.paid_amount, r.late_fee, r.due_date);
    const balance = calculateBalance(r.amount, r.paid_amount, r.late_fee);
    return {
      id: r.id,
      academyId: r.academy_id,
      studentId: r.student_id,
      studentName: r.student_name,
      rollNo: r.roll_no,
      fatherName: r.father_name,
      parentPhone: r.parent_phone,
      classId: r.class_id,
      className: r.class_name,
      classSection: r.class_section,
      month: r.month,
      monthName: getMonthName(r.month),
      year: r.year,
      amount: r.amount,
      paidAmount: r.paid_amount,
      lateFee: r.late_fee,
      balance,
      dueDate: r.due_date,
      status: computedStatus,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  });

  return { fees, total };
}

/**
 * 3. Monthly Fee Collection Summary (expected, collected, pending, overdue, percentage, counts).
 *
 * @param {number} academyId
 * @param {{ month?: number, year?: number }} param1
 * @returns {Promise<object>}
 */
export async function getFeeSummary(academyId, { month, year }) {
  const current = getCurrentYearMonthKarachi();
  const targetMonth = month ? Number(month) : current.month;
  const targetYear = year ? Number(year) : current.year;

  const rows = await query(
    `SELECT f.id, f.amount, f.paid_amount, f.late_fee, f.due_date
     FROM fees f
     WHERE f.academy_id = :academyId AND f.month = :targetMonth AND f.year = :targetYear`,
    { academyId, targetMonth, targetYear }
  );

  let expected = 0;
  let collected = 0;
  let pending = 0;
  let overdue = 0;

  const countByStatus = {
    pending: 0,
    partial: 0,
    paid: 0,
    overdue: 0,
    total: rows.length,
  };

  const todayStr = getTodayDateKarachi();

  for (const r of rows) {
    const totalPayable = (Number(r.amount) || 0) + (Number(r.late_fee) || 0);
    const paid = Number(r.paid_amount) || 0;
    const balance = Math.max(0, totalPayable - paid);
    const status = calculateFeeStatus(r.amount, r.paid_amount, r.late_fee, r.due_date);

    expected += totalPayable;
    collected += paid;

    if (status === "paid") {
      countByStatus.paid++;
    } else if (status === "overdue") {
      countByStatus.overdue++;
      overdue += balance;
    } else if (status === "partial") {
      countByStatus.partial++;
      pending += balance;
    } else {
      countByStatus.pending++;
      pending += balance;
    }
  }

  const collectionPercent = expected > 0 ? Number(((collected / expected) * 100).toFixed(1)) : 0;

  return {
    month: targetMonth,
    monthName: getMonthName(targetMonth),
    year: targetYear,
    expected,
    collected,
    pending,
    overdue,
    collectionPercent,
    countByStatus,
  };
}

/**
 * 4. Get full fee history and payment transactions of one student.
 *
 * @param {number} academyId
 * @param {number} studentId
 * @returns {Promise<object>}
 */
export async function getStudentFeeHistory(academyId, studentId) {
  // 1. Fetch student info
  const students = await query(
    `SELECT s.id, s.name, s.roll_no, s.father_name, s.parent_phone, s.monthly_fee, s.discount,
            c.id AS class_id, c.name AS class_name, c.section AS class_section
     FROM students s
     JOIN classes c ON s.class_id = c.id
     WHERE s.id = :studentId AND s.academy_id = :academyId AND s.deleted_at IS NULL
     LIMIT 1`,
    { studentId, academyId }
  );

  if (!students || students.length === 0) {
    throw ApiError.notFound("Student record not found.");
  }
  const student = students[0];

  // 2. Fetch all fee records
  const feeRows = await query(
    `SELECT f.id, f.month, f.year, f.amount, f.paid_amount, f.late_fee, f.due_date, f.status, f.created_at
     FROM fees f
     WHERE f.student_id = :studentId AND f.academy_id = :academyId
     ORDER BY f.year DESC, f.month DESC`,
    { studentId, academyId }
  );

  // 3. Fetch all payments for this student
  const paymentRows = await query(
    `SELECT p.id, p.fee_id, p.receipt_no, p.amount, p.method, p.paid_on, p.note, p.created_at,
            u.name AS received_by_name
     FROM payments p
     LEFT JOIN users u ON p.received_by = u.id
     WHERE p.student_id = :studentId AND p.academy_id = :academyId
     ORDER BY p.id DESC`,
    { studentId, academyId }
  );

  // Map payments by fee_id
  const paymentsByFeeId = new Map();
  for (const p of paymentRows) {
    if (!paymentsByFeeId.has(p.fee_id)) {
      paymentsByFeeId.set(p.fee_id, []);
    }
    paymentsByFeeId.get(p.fee_id).push({
      id: p.id,
      receiptNo: p.receipt_no,
      amount: p.amount,
      method: p.method,
      paidOn: p.paid_on,
      note: p.note,
      receivedBy: p.received_by_name || "System",
      createdAt: p.created_at,
    });
  }

  let totalBilled = 0;
  let totalPaid = 0;
  let pendingMonthsCount = 0;

  const fees = feeRows.map((f) => {
    const totalPayable = f.amount + f.late_fee;
    const balance = calculateBalance(f.amount, f.paid_amount, f.late_fee);
    const computedStatus = calculateFeeStatus(f.amount, f.paid_amount, f.late_fee, f.due_date);

    totalBilled += totalPayable;
    totalPaid += f.paid_amount;
    if (balance > 0) {
      pendingMonthsCount++;
    }

    return {
      id: f.id,
      month: f.month,
      monthName: getMonthName(f.month),
      year: f.year,
      amount: f.amount,
      lateFee: f.late_fee,
      totalPayable,
      paidAmount: f.paid_amount,
      balance,
      dueDate: f.due_date,
      status: computedStatus,
      createdAt: f.created_at,
      payments: paymentsByFeeId.get(f.id) || [],
    };
  });

  return {
    student: {
      id: student.id,
      name: student.name,
      rollNo: student.roll_no,
      fatherName: student.father_name,
      parentPhone: student.parent_phone,
      classId: student.class_id,
      className: student.class_name,
      classSection: student.class_section,
      monthlyFee: student.monthly_fee,
      discount: student.discount,
    },
    summary: {
      totalBilled,
      totalPaid,
      totalBalance: Math.max(0, totalBilled - totalPaid),
      pendingMonthsCount,
      totalInvoicesCount: fees.length,
    },
    fees,
  };
}

/**
 * 5. Collect fee payment.
 * Supports:
 * - Single fee by feeId
 * - Single fee by studentId + month + year
 * - Multi-month payment allocating oldest unpaid month(s) first
 * Runs within a database transaction with SELECT ... FOR UPDATE row locks.
 *
 * @param {number} academyId
 * @param {number} userId
 * @param {object} data
 * @returns {Promise<object>}
 */
export async function collectPayment(academyId, userId, data) {
  const { feeId, studentId, month, year, amount, method = "cash", paidOn, note } = data;
  const paymentDate = paidOn || getTodayDateKarachi();

  return await withTransaction(async (conn) => {
    // ------------------------------------------------------------------------
    // CASE 1: Single fee payment by feeId or (studentId + month + year)
    // ------------------------------------------------------------------------
    if (feeId || (studentId && month && year)) {
      let targetFeeId = feeId;

      if (!targetFeeId) {
        const [foundFees] = await conn.query(
          `SELECT id FROM fees 
           WHERE student_id = :studentId AND month = :month AND year = :year AND academy_id = :academyId 
           LIMIT 1`,
          { studentId, month, year, academyId }
        );
        if (!foundFees || foundFees.length === 0) {
          throw ApiError.notFound("Fee invoice not found for the specified student and month/year.");
        }
        targetFeeId = foundFees[0].id;
      }

      // Lock the fee row with FOR UPDATE
      const [feeRows] = await conn.query(
        `SELECT * FROM fees WHERE id = :feeId AND academy_id = :academyId FOR UPDATE`,
        { feeId: targetFeeId, academyId }
      );

      if (!feeRows || feeRows.length === 0) {
        throw ApiError.notFound("Fee record not found.");
      }

      const fee = feeRows[0];
      const balance = calculateBalance(fee.amount, fee.paid_amount, fee.late_fee);

      if (balance <= 0) {
        throw ApiError.badRequest("This fee invoice is already fully paid.");
      }

      if (amount > balance) {
        throw ApiError.badRequest(
          `Payment amount (PKR ${amount}) exceeds the remaining balance (PKR ${balance}).`
        );
      }

      // Generate sequential receipt number atomically
      const receiptNo = await generateReceiptNumber(conn, academyId, fee.year);

      // Insert payment record
      const [insertRes] = await conn.query(
        `INSERT INTO payments (academy_id, fee_id, student_id, receipt_no, amount, method, paid_on, note, received_by)
         VALUES (:academyId, :feeId, :studentId, :receiptNo, :amount, :method, :paidOn, :note, :receivedBy)`,
        {
          academyId,
          feeId: fee.id,
          studentId: fee.student_id,
          receiptNo,
          amount,
          method,
          paidOn: paymentDate,
          note: note || null,
          receivedBy: userId,
        }
      );

      const paymentId = insertRes.insertId;

      // Update fee paid_amount and status
      const newPaid = fee.paid_amount + amount;
      const newStatus = calculateFeeStatus(fee.amount, newPaid, fee.late_fee, fee.due_date);

      await conn.query(
        `UPDATE fees SET paid_amount = :newPaid, status = :newStatus WHERE id = :feeId`,
        { newPaid, newStatus, feeId: fee.id }
      );

      // Audit log entry
      await conn.query(
        `INSERT INTO activity_logs (academy_id, user_id, action, entity, entity_id, meta)
         VALUES (:academyId, :userId, 'fee_payment_collected', 'payment', :paymentId, :meta)`,
        {
          academyId,
          userId,
          paymentId,
          meta: JSON.stringify({
            feeId: fee.id,
            studentId: fee.student_id,
            amount,
            receiptNo,
            method,
            remainingBalance: balance - amount,
          }),
        }
      );

      return {
        isMultiMonth: false,
        payment: {
          id: paymentId,
          feeId: fee.id,
          studentId: fee.student_id,
          receiptNo,
          amount,
          method,
          paidOn: paymentDate,
          note: note || null,
        },
        updatedFee: {
          id: fee.id,
          month: fee.month,
          year: fee.year,
          amount: fee.amount,
          lateFee: fee.late_fee,
          paidAmount: newPaid,
          balance: Math.max(0, balance - amount),
          status: newStatus,
        },
      };
    }

    // ------------------------------------------------------------------------
    // CASE 2: Multi-month payment allocating oldest unpaid month(s) first
    // ------------------------------------------------------------------------
    if (studentId) {
      // Find and lock all unpaid/partial fees ordered chronologically
      const [unpaidFees] = await conn.query(
        `SELECT * FROM fees 
         WHERE student_id = :studentId 
           AND academy_id = :academyId 
           AND paid_amount < (amount + late_fee)
         ORDER BY year ASC, month ASC
         FOR UPDATE`,
        { studentId, academyId }
      );

      if (!unpaidFees || unpaidFees.length === 0) {
        throw ApiError.badRequest("No outstanding fee invoices found for this student.");
      }

      const totalOutstanding = unpaidFees.reduce(
        (sum, f) => sum + (f.amount + f.late_fee - f.paid_amount),
        0
      );

      if (amount > totalOutstanding) {
        throw ApiError.badRequest(
          `Payment amount (PKR ${amount}) exceeds the total outstanding balance (PKR ${totalOutstanding}).`
        );
      }

      let remainingToAllocate = amount;
      const createdPayments = [];
      const updatedFees = [];

      for (const fee of unpaidFees) {
        if (remainingToAllocate <= 0) break;

        const currentBalance = fee.amount + fee.late_fee - fee.paid_amount;
        const allocationForThisFee = Math.min(remainingToAllocate, currentBalance);

        // Generate receipt number atomically for each fee payment
        const receiptNo = await generateReceiptNumber(conn, academyId, fee.year);

        const [pRes] = await conn.query(
          `INSERT INTO payments (academy_id, fee_id, student_id, receipt_no, amount, method, paid_on, note, received_by)
           VALUES (:academyId, :feeId, :studentId, :receiptNo, :amount, :method, :paidOn, :note, :receivedBy)`,
          {
            academyId,
            feeId: fee.id,
            studentId: fee.student_id,
            receiptNo,
            amount: allocationForThisFee,
            method,
            paidOn: paymentDate,
            note: note || `Multi-month payment allocation for ${getMonthName(fee.month)} ${fee.year}`,
            receivedBy: userId,
          }
        );

        const newPaid = fee.paid_amount + allocationForThisFee;
        const newStatus = calculateFeeStatus(fee.amount, newPaid, fee.late_fee, fee.due_date);

        await conn.query(
          `UPDATE fees SET paid_amount = :newPaid, status = :newStatus WHERE id = :feeId`,
          { newPaid, newStatus, feeId: fee.id }
        );

        await conn.query(
          `INSERT INTO activity_logs (academy_id, user_id, action, entity, entity_id, meta)
           VALUES (:academyId, :userId, 'fee_payment_collected', 'payment', :paymentId, :meta)`,
          {
            academyId,
            userId,
            paymentId: pRes.insertId,
            meta: JSON.stringify({
              feeId: fee.id,
              studentId: fee.student_id,
              amount: allocationForThisFee,
              receiptNo,
              method,
              multiMonthAllocation: true,
            }),
          }
        );

        createdPayments.push({
          id: pRes.insertId,
          feeId: fee.id,
          receiptNo,
          amount: allocationForThisFee,
          month: fee.month,
          year: fee.year,
          paidOn: paymentDate,
        });

        updatedFees.push({
          id: fee.id,
          month: fee.month,
          year: fee.year,
          paidAmount: newPaid,
          balance: currentBalance - allocationForThisFee,
          status: newStatus,
        });

        remainingToAllocate -= allocationForThisFee;
      }

      return {
        isMultiMonth: true,
        totalAllocated: amount,
        payments: createdPayments,
        updatedFees,
      };
    }

    throw ApiError.badRequest("Either feeId or studentId must be specified for collecting payment.");
  });

  clearDashboardCache(academyId);
  return result;
}

/**
 * 6. List payments with filters (date range, method, student, q) and range totals.
 *
 * @param {number} academyId
 * @param {object} filters
 * @returns {Promise<{ payments: Array, rangeTotals: { totalAmount: number, count: number }, total: number }>}
 */
export async function getPaymentsList(academyId, filters) {
  const { startDate, endDate, method, studentId, q, limit = 10, offset = 0 } = filters;

  const whereClauses = ["p.academy_id = :academyId"];
  const params = { academyId, limit, offset };

  if (startDate) {
    whereClauses.push("p.paid_on >= :startDate");
    params.startDate = startDate;
  }

  if (endDate) {
    whereClauses.push("p.paid_on <= :endDate");
    params.endDate = endDate;
  }

  if (method) {
    whereClauses.push("p.method = :method");
    params.method = method;
  }

  if (studentId) {
    whereClauses.push("p.student_id = :studentId");
    params.studentId = Number(studentId);
  }

  if (q) {
    whereClauses.push("(s.name LIKE :q OR s.roll_no LIKE :q OR p.receipt_no LIKE :q)");
    params.q = `%${q}%`;
  }

  const whereSql = whereClauses.join(" AND ");

  // Aggregation for totals over the entire filtered range
  const totalsSql = `
    SELECT COUNT(p.id) AS count, COALESCE(SUM(p.amount), 0) AS totalAmount
    FROM payments p
    JOIN students s ON p.student_id = s.id
    WHERE ${whereSql}
  `;
  const totalsResult = await query(totalsSql, params);
  const totalCount = totalsResult[0]?.count || 0;
  const totalAmount = Number(totalsResult[0]?.totalAmount) || 0;

  // Paginated rows
  const listSql = `
    SELECT 
      p.id,
      p.receipt_no,
      p.amount,
      p.method,
      p.paid_on,
      p.note,
      p.created_at,
      p.fee_id,
      f.month,
      f.year,
      s.id AS student_id,
      s.name AS student_name,
      s.roll_no,
      s.parent_phone,
      c.name AS class_name,
      u.name AS received_by_name
    FROM payments p
    JOIN students s ON p.student_id = s.id
    JOIN fees f ON p.fee_id = f.id
    JOIN classes c ON s.class_id = c.id
    LEFT JOIN users u ON p.received_by = u.id
    WHERE ${whereSql}
    ORDER BY p.id DESC
    LIMIT :limit OFFSET :offset
  `;

  const rows = await query(listSql, params);

  const payments = rows.map((r) => ({
    id: r.id,
    receiptNo: r.receipt_no,
    amount: r.amount,
    method: r.method,
    paidOn: r.paid_on,
    note: r.note,
    createdAt: r.created_at,
    feeId: r.fee_id,
    month: r.month,
    monthName: getMonthName(r.month),
    year: r.year,
    student: {
      id: r.student_id,
      name: r.student_name,
      rollNo: r.roll_no,
      parentPhone: r.parent_phone,
      className: r.class_name,
    },
    receivedBy: r.received_by_name || "System",
  }));

  return {
    payments,
    rangeTotals: {
      totalAmount,
      count: totalCount,
    },
    total: totalCount,
  };
}

/**
 * 7. Get full receipt print payload for a payment.
 *
 * @param {number} academyId
 * @param {number} paymentId
 * @returns {Promise<object>}
 */
export async function getReceiptDetails(academyId, paymentId) {
  const sql = `
    SELECT 
      p.id AS payment_id, p.receipt_no, p.amount AS paid_amount, p.method, p.paid_on, p.note, p.created_at AS payment_time,
      u.name AS received_by_name,
      f.id AS fee_id, f.month, f.year, f.amount AS invoice_amount, f.late_fee, f.paid_amount AS total_paid_on_fee, f.due_date,
      s.id AS student_id, s.name AS student_name, s.father_name, s.roll_no, s.parent_phone,
      c.name AS class_name, c.section AS class_section,
      a.id AS academy_id, a.name AS academy_name, a.address AS academy_address, a.phone AS academy_phone, a.email AS academy_email, a.logo_url AS academy_logo
    FROM payments p
    JOIN fees f ON p.fee_id = f.id
    JOIN students s ON p.student_id = s.id
    JOIN classes c ON s.class_id = c.id
    JOIN academies a ON p.academy_id = a.id
    LEFT JOIN users u ON p.received_by = u.id
    WHERE p.id = :paymentId AND p.academy_id = :academyId
    LIMIT 1
  `;

  const rows = await query(sql, { paymentId, academyId });
  if (!rows || rows.length === 0) {
    throw ApiError.notFound("Receipt not found.");
  }

  const row = rows[0];
  const balanceAfterPayment = calculateBalance(row.invoice_amount, row.total_paid_on_fee, row.late_fee);

  // Calculate current total outstanding balance across all fees for this student
  const balanceRes = await query(
    `SELECT COALESCE(SUM(amount + late_fee - paid_amount), 0) AS total_balance
     FROM fees
     WHERE student_id = :studentId AND academy_id = :academyId`,
    { studentId: row.student_id, academyId }
  );
  const studentTotalBalance = Number(balanceRes[0]?.total_balance || 0);

  return {
    academy: {
      id: row.academy_id,
      name: row.academy_name,
      address: row.academy_address,
      phone: row.academy_phone,
      email: row.academy_email,
      logoUrl: row.academy_logo,
    },
    student: {
      id: row.student_id,
      name: row.student_name,
      rollNo: row.roll_no,
      fatherName: row.father_name,
      className: row.class_name,
      section: row.class_section,
      parentPhone: row.parent_phone,
    },
    fee: {
      id: row.fee_id,
      month: row.month,
      monthName: getMonthName(row.month),
      year: row.year,
      amount: row.invoice_amount,
      lateFee: row.late_fee,
      totalPayable: row.invoice_amount + row.late_fee,
      dueDate: row.due_date,
    },
    payment: {
      id: row.payment_id,
      receiptNo: row.receipt_no,
      amount: row.paid_amount,
      method: row.method,
      paidOn: row.paid_on,
      note: row.note,
      receivedBy: row.received_by_name || "System",
      createdAt: row.payment_time,
    },
    balanceAfterPayment,
    studentTotalBalance,
  };
}

/**
 * 8. Reverse a fee payment (Owner only).
 * Lowers fee paid_amount, recalculates fee status, removes payment, and writes audit log.
 *
 * @param {number} academyId
 * @param {number} userId
 * @param {number} paymentId
 * @param {string} reason
 * @returns {Promise<object>}
 */
export async function reversePayment(academyId, userId, paymentId, reason) {
  return await withTransaction(async (conn) => {
    // 1. Lock payment row
    const [paymentRows] = await conn.query(
      `SELECT * FROM payments WHERE id = :paymentId AND academy_id = :academyId FOR UPDATE`,
      { paymentId, academyId }
    );

    if (!paymentRows || paymentRows.length === 0) {
      throw ApiError.notFound("Payment record not found.");
    }
    const payment = paymentRows[0];

    // 2. Lock associated fee
    const [feeRows] = await conn.query(
      `SELECT * FROM fees WHERE id = :feeId AND academy_id = :academyId FOR UPDATE`,
      { feeId: payment.fee_id, academyId }
    );

    if (!feeRows || feeRows.length === 0) {
      throw ApiError.notFound("Associated fee invoice not found.");
    }
    const fee = feeRows[0];

    // 3. Lower paid amount and recalculate status
    const newPaid = Math.max(0, fee.paid_amount - payment.amount);
    const newStatus = calculateFeeStatus(fee.amount, newPaid, fee.late_fee, fee.due_date);

    await conn.query(
      `UPDATE fees SET paid_amount = :newPaid, status = :newStatus WHERE id = :feeId`,
      { newPaid, newStatus, feeId: fee.id }
    );

    // 4. Delete payment row
    await conn.query(`DELETE FROM payments WHERE id = :paymentId`, { paymentId });

    // 5. Insert activity log
    await conn.query(
      `INSERT INTO activity_logs (academy_id, user_id, action, entity, entity_id, meta)
       VALUES (:academyId, :userId, 'fee_payment_reversed', 'payment', :paymentId, :meta)`,
      {
        academyId,
        userId,
        paymentId,
        meta: JSON.stringify({
          paymentId: payment.id,
          receiptNo: payment.receipt_no,
          amount: payment.amount,
          feeId: fee.id,
          studentId: payment.student_id,
          reason,
          reversedBy: userId,
        }),
      }
    );

    return {
      message: "Payment reversed successfully.",
      reversedPaymentId: payment.id,
      receiptNo: payment.receipt_no,
      amount: payment.amount,
      reason,
      updatedFee: {
        id: fee.id,
        paidAmount: newPaid,
        balance: calculateBalance(fee.amount, newPaid, fee.late_fee),
        status: newStatus,
      },
    };
  });

  clearDashboardCache(academyId);
  return result;
}

/**
 * 9. Adjust fee details (Owner only).
 * Adjusts net amount, late fee, due date, or note.
 * Rule: A fully paid fee can NEVER be modified without a reversal first.
 *
 * @param {number} academyId
 * @param {number} userId
 * @param {number} feeId
 * @param {object} adjustments
 * @returns {Promise<object>}
 */
export async function adjustFee(academyId, userId, feeId, adjustments) {
  return await withTransaction(async (conn) => {
    // 1. Lock fee row
    const [feeRows] = await conn.query(
      `SELECT * FROM fees WHERE id = :feeId AND academy_id = :academyId FOR UPDATE`,
      { feeId, academyId }
    );

    if (!feeRows || feeRows.length === 0) {
      throw ApiError.notFound("Fee record not found.");
    }
    const fee = feeRows[0];

    // 2. Enforce business rule: Fully paid fee cannot be altered
    const totalPayable = fee.amount + fee.late_fee;
    if (fee.paid_amount >= totalPayable && totalPayable > 0) {
      throw ApiError.badRequest(
        "A fully paid fee cannot be modified. Reverse payments first if changes are needed."
      );
    }

    // 3. Compute new values
    const newAmount = adjustments.amount !== undefined ? adjustments.amount : fee.amount;
    const newLateFee = adjustments.lateFee !== undefined ? adjustments.lateFee : fee.late_fee;
    const newDueDate = adjustments.dueDate || fee.due_date;

    const newTotal = newAmount + newLateFee;
    if (newTotal < fee.paid_amount) {
      throw ApiError.badRequest(
        `New fee total (PKR ${newTotal}) cannot be less than already collected amount (PKR ${fee.paid_amount}). Reverse payment first if necessary.`
      );
    }

    const newStatus = calculateFeeStatus(newAmount, fee.paid_amount, newLateFee, newDueDate);

    // 4. Update fee
    await conn.query(
      `UPDATE fees 
       SET amount = :newAmount, late_fee = :newLateFee, due_date = :newDueDate, status = :newStatus
       WHERE id = :feeId`,
      { newAmount, newLateFee, newDueDate, newStatus, feeId: fee.id }
    );

    // 5. Activity log
    await conn.query(
      `INSERT INTO activity_logs (academy_id, user_id, action, entity, entity_id, meta)
       VALUES (:academyId, :userId, 'fee_adjusted', 'fee', :feeId, :meta)`,
      {
        academyId,
        userId,
        feeId: fee.id,
        meta: JSON.stringify({
          previous: {
            amount: fee.amount,
            lateFee: fee.late_fee,
            dueDate: fee.due_date,
            status: fee.status,
          },
          updated: {
            amount: newAmount,
            lateFee: newLateFee,
            dueDate: newDueDate,
            status: newStatus,
          },
          note: adjustments.note || null,
        }),
      }
    );

    return {
      id: fee.id,
      studentId: fee.student_id,
      month: fee.month,
      year: fee.year,
      amount: newAmount,
      lateFee: newLateFee,
      paidAmount: fee.paid_amount,
      balance: calculateBalance(newAmount, fee.paid_amount, newLateFee),
      dueDate: newDueDate,
      status: newStatus,
    };
  });

  clearDashboardCache(academyId);
  return result;
}

/**
 * 10. List defaulters (students with overdue unpaid dues across >= minMonths).
 * Sorted by outstanding balance descending.
 *
 * @param {number} academyId
 * @param {{ minMonths?: number }} param1
 * @returns {Promise<object>}
 */
export async function getDefaulters(academyId, { minMonths = 1 }) {
  const threshold = Math.max(1, Number(minMonths) || 1);

  // 1. Fetch overdue fee rows with balance > 0
  const sql = `
    SELECT 
      f.id AS fee_id,
      f.student_id,
      f.month,
      f.year,
      f.amount,
      f.late_fee,
      f.paid_amount,
      f.due_date,
      DATEDIFF(CURRENT_DATE(), f.due_date) AS days_overdue,
      (f.amount + f.late_fee - f.paid_amount) AS balance,
      s.name AS student_name,
      s.roll_no,
      s.father_name,
      s.parent_phone,
      c.name AS class_name
    FROM fees f
    JOIN students s ON f.student_id = s.id
    JOIN classes c ON s.class_id = c.id
    WHERE f.academy_id = :academyId
      AND s.deleted_at IS NULL
      AND (f.amount + f.late_fee) > f.paid_amount
      AND f.due_date < CURRENT_DATE()
    ORDER BY f.student_id, f.year ASC, f.month ASC
  `;

  const rows = await query(sql, { academyId });

  // 2. Fetch last payment date for each student in the academy
  const lastPaymentRows = await query(
    `SELECT student_id, MAX(paid_on) AS last_payment_date
     FROM payments
     WHERE academy_id = :academyId
     GROUP BY student_id`,
    { academyId }
  );

  const lastPaymentMap = new Map();
  for (const lp of lastPaymentRows) {
    lastPaymentMap.set(lp.student_id, lp.last_payment_date);
  }

  // 3. Group by student
  const studentMap = new Map();
  for (const r of rows) {
    if (!studentMap.has(r.student_id)) {
      studentMap.set(r.student_id, {
        studentId: r.student_id,
        studentName: r.student_name,
        rollNo: r.roll_no,
        fatherName: r.father_name,
        className: r.class_name,
        parentPhone: r.parent_phone,
        lastPaymentDate: lastPaymentMap.get(r.student_id) || null,
        totalOutstandingBalance: 0,
        overdueMonthsCount: 0,
        overdueMonths: [],
      });
    }

    const studentRecord = studentMap.get(r.student_id);
    studentRecord.totalOutstandingBalance += r.balance;
    studentRecord.overdueMonthsCount++;
    studentRecord.overdueMonths.push({
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

  // Filter by minMonths and sort descending by totalOutstandingBalance
  const defaulters = Array.from(studentMap.values())
    .filter((d) => d.overdueMonthsCount >= threshold)
    .sort((a, b) => b.totalOutstandingBalance - a.totalOutstandingBalance);

  const totalOverdueAmount = defaulters.reduce((acc, d) => acc + d.totalOutstandingBalance, 0);

  return {
    minMonths: threshold,
    totalDefaulters: defaulters.length,
    totalOverdueAmount,
    defaulters,
  };
}

/**
 * 11. Generate CSV export of the fee ledger for a specific month/year.
 *
 * @param {number} academyId
 * @param {{ month?: number, year?: number }} param1
 * @returns {Promise<{ csv: string, filename: string }>}
 */
export async function exportFeesCsv(academyId, { month, year }) {
  const current = getCurrentYearMonthKarachi();
  const targetMonth = month ? Number(month) : current.month;
  const targetYear = year ? Number(year) : current.year;

  const sql = `
    SELECT 
      s.roll_no,
      s.name AS student_name,
      c.name AS class_name,
      s.monthly_fee AS student_base_fee,
      s.discount AS student_discount,
      f.amount AS net_fee,
      f.late_fee,
      f.paid_amount,
      f.due_date,
      (SELECT MAX(p.paid_on) FROM payments p WHERE p.fee_id = f.id) AS last_payment_date
    FROM fees f
    JOIN students s ON f.student_id = s.id
    JOIN classes c ON s.class_id = c.id
    WHERE f.academy_id = :academyId
      AND f.month = :targetMonth
      AND f.year = :targetYear
    ORDER BY s.roll_no ASC
  `;

  const rows = await query(sql, { academyId, targetMonth, targetYear });

  const headers = [
    "Roll No",
    "Student Name",
    "Class",
    "Monthly Fee",
    "Discount",
    "Net Fee",
    "Late Fee",
    "Paid Amount",
    "Balance",
    "Status",
    "Last Payment Date",
  ];

  const escapeCsv = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvLines = [headers.join(",")];

  for (const r of rows) {
    const status = calculateFeeStatus(r.net_fee, r.paid_amount, r.late_fee, r.due_date);
    const balance = calculateBalance(r.net_fee, r.paid_amount, r.late_fee);

    csvLines.push(
      [
        escapeCsv(r.roll_no),
        escapeCsv(r.student_name),
        escapeCsv(r.class_name),
        r.student_base_fee,
        r.student_discount,
        r.net_fee,
        r.late_fee,
        r.paid_amount,
        balance,
        escapeCsv(status),
        escapeCsv(r.last_payment_date || "N/A"),
      ].join(",")
    );
  }

  const filename = `fee-ledger-${targetYear}-${String(targetMonth).padStart(2, "0")}.csv`;
  return {
    csv: csvLines.join("\r\n"),
    filename,
  };
}

/**
 * 12a. Get class fee structure.
 *
 * @param {number} academyId
 * @returns {Promise<object>}
 */
export async function getFeeStructure(academyId) {
  const sql = `
    SELECT 
      c.id AS class_id,
      c.name AS class_name,
      c.section AS section,
      c.monthly_fee,
      COUNT(s.id) AS active_students_count,
      (c.monthly_fee * COUNT(s.id)) AS expected_monthly_revenue
    FROM classes c
    LEFT JOIN students s ON s.class_id = c.id AND s.status = 'active' AND s.deleted_at IS NULL
    WHERE c.academy_id = :academyId AND c.deleted_at IS NULL
    GROUP BY c.id, c.name, c.section, c.monthly_fee
    ORDER BY c.id ASC
  `;

  const rows = await query(sql, { academyId });

  let totalActiveStudents = 0;
  let totalExpectedMonthlyRevenue = 0;

  const classes = rows.map((r) => {
    const studentCount = Number(r.active_students_count) || 0;
    const revenue = Number(r.expected_monthly_revenue) || 0;
    totalActiveStudents += studentCount;
    totalExpectedMonthlyRevenue += revenue;

    return {
      classId: r.class_id,
      className: r.class_name,
      section: r.section,
      monthlyFee: r.monthly_fee,
      activeStudentsCount: studentCount,
      expectedMonthlyRevenue: revenue,
    };
  });

  return {
    classes,
    totalClasses: classes.length,
    totalActiveStudents,
    totalExpectedMonthlyRevenue,
  };
}

/**
 * 12b. Update class fee structure.
 *
 * @param {number} academyId
 * @param {number} userId
 * @param {object} param2
 * @returns {Promise<object>}
 */
export async function updateFeeStructure(academyId, userId, { updates, applyToActiveStudents, fromMonth, fromYear }) {
  return await withTransaction(async (conn) => {
    for (const update of updates) {
      // 1. Update class monthly fee
      await conn.query(
        `UPDATE classes SET monthly_fee = :monthlyFee WHERE id = :classId AND academy_id = :academyId`,
        { monthlyFee: update.monthlyFee, classId: update.classId, academyId }
      );

      // 2. Cascading update to active students if requested
      if (applyToActiveStudents) {
        await conn.query(
          `UPDATE students 
           SET monthly_fee = :monthlyFee 
           WHERE class_id = :classId AND academy_id = :academyId AND status = 'active' AND deleted_at IS NULL`,
          { monthlyFee: update.monthlyFee, classId: update.classId, academyId }
        );

        // 3. Update existing unpaid fee rows (paid_amount = 0) from specified month/year forward
        if (fromMonth && fromYear) {
          await conn.query(
            `UPDATE fees f
             JOIN students s ON f.student_id = s.id
             SET f.amount = GREATEST(0, CAST(:monthlyFee AS SIGNED) - CAST(s.discount AS SIGNED))
             WHERE s.class_id = :classId
               AND f.academy_id = :academyId
               AND f.paid_amount = 0
               AND (f.year > :fromYear OR (f.year = :fromYear AND f.month >= :fromMonth))`,
            { monthlyFee: update.monthlyFee, classId: update.classId, academyId, fromYear, fromMonth }
          );
        }
      }
    }

    // Activity log
    await conn.query(
      `INSERT INTO activity_logs (academy_id, user_id, action, entity, entity_id, meta)
       VALUES (:academyId, :userId, 'fee_structure_updated', 'class', NULL, :meta)`,
      {
        academyId,
        userId,
        meta: JSON.stringify({ updates, applyToActiveStudents, fromMonth, fromYear }),
      }
    );

    return {
      message: "Fee structure updated successfully.",
      updatedClassesCount: updates.length,
      appliedToActiveStudents: Boolean(applyToActiveStudents),
    };
  });

  clearDashboardCache(academyId);
  return result;
}

/**
 * 13. Reusable idempotent function to mark overdue fees and apply late fees.
 * Can be triggered via cron or internal maintenance.
 * Only applies late fee once when late_fee = 0 and late_fee_enabled is TRUE.
 *
 * @param {number|null} academyId - Optional single academy target
 * @returns {Promise<{ updatedCount: number }>}
 */
export async function markOverdueAndApplyLateFees(academyId = null) {
  return await withTransaction(async (conn) => {
    // 1. Add late fee to overdue invoices for academies that have late fee enabled
    let lateFeeSql = `
      UPDATE fees f
      JOIN academies a ON f.academy_id = a.id
      SET 
        f.late_fee = a.late_fee_amount,
        f.status = 'overdue'
      WHERE f.due_date < CURRENT_DATE()
        AND f.paid_amount < f.amount
        AND f.late_fee = 0
        AND a.late_fee_enabled = TRUE
        AND a.late_fee_amount > 0
    `;
    const params = {};
    if (academyId) {
      lateFeeSql += ` AND f.academy_id = :academyId`;
      params.academyId = academyId;
    }
    const [res1] = await conn.query(lateFeeSql, params);

    // 2. Mark remaining unpaid fees past due date as 'overdue' (if not already)
    let overdueSql = `
      UPDATE fees f
      SET f.status = 'overdue'
      WHERE f.due_date < CURRENT_DATE()
        AND (f.amount + f.late_fee) > f.paid_amount
        AND f.status IN ('pending', 'partial')
    `;
    if (academyId) {
      overdueSql += ` AND f.academy_id = :academyId`;
    }
    const [res2] = await conn.query(overdueSql, params);

    return {
      updatedCount: (res1.affectedRows || 0) + (res2.affectedRows || 0),
    };
  });

  clearDashboardCache(academyId);
  return result;
}

export default {
  generateMonthlyFees,
  getFeesList,
  getFeeSummary,
  getStudentFeeHistory,
  collectPayment,
  getPaymentsList,
  getReceiptDetails,
  reversePayment,
  adjustFee,
  getDefaulters,
  exportFeesCsv,
  getFeeStructure,
  updateFeeStructure,
  markOverdueAndApplyLateFees,
};
