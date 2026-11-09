import { query, withTransaction } from "../config/db.js";
import ApiError from "../utils/ApiError.js";

export async function getFeeInvoices(academyId, { search, classId, status, month, limit, offset }) {
  let sql = `
    SELECT f.id, f.student_id, f.month, f.amount, f.paid_amount, f.status, f.due_date, f.payment_method, f.paid_at,
           s.full_name AS student_name, s.roll_number, s.parent_phone,
           c.name AS class_name
    FROM fee_invoices f
    JOIN students s ON f.student_id = s.id
    JOIN classes c ON s.class_id = c.id
    WHERE f.academy_id = :academyId
  `;
  const params = { academyId };

  if (search) {
    sql += ` AND (s.full_name LIKE :search OR s.roll_number LIKE :search)`;
    params.search = `%${search}%`;
  }
  if (classId) {
    sql += ` AND s.class_id = :classId`;
    params.classId = classId;
  }
  if (status && status !== "All") {
    sql += ` AND f.status = :status`;
    params.status = status;
  }
  if (month) {
    sql += ` AND f.month = :month`;
    params.month = month;
  }

  const countRes = await query(`SELECT COUNT(*) AS total FROM (${sql}) AS sub`, params);
  const total = countRes[0]?.total || 0;

  sql += ` ORDER BY f.id DESC LIMIT :limit OFFSET :offset`;
  params.limit = limit;
  params.offset = offset;

  const invoices = await query(sql, params);
  return { invoices, total };
}

export async function collectFee(academyId, data) {
  return await withTransaction(async (conn) => {
    // 1. Find or create invoice for the month
    const [existing] = await conn.query(
      `SELECT * FROM fee_invoices WHERE academy_id = :academyId AND student_id = :studentId AND month = :month LIMIT 1`,
      { academyId, studentId: data.studentId, month: data.month }
    );

    let invoiceId;
    let newPaid = data.amount;
    let totalDue = data.amount;

    if (existing.length > 0) {
      const inv = existing[0];
      invoiceId = inv.id;
      totalDue = inv.amount;
      newPaid = Number(inv.paid_amount) + Number(data.amount);
      const newStatus = newPaid >= totalDue ? "Paid" : "Partial";

      await conn.query(
        `UPDATE fee_invoices 
         SET paid_amount = :newPaid, status = :newStatus, payment_method = :paymentMethod, paid_at = NOW()
         WHERE id = :invoiceId`,
        { newPaid, newStatus, paymentMethod: data.paymentMethod, invoiceId }
      );
    } else {
      const newStatus = "Paid";
      const [insertRes] = await conn.query(
        `INSERT INTO fee_invoices (academy_id, student_id, month, amount, paid_amount, status, payment_method, due_date, paid_at)
         VALUES (:academyId, :studentId, :month, :amount, :amount, :status, :paymentMethod, :dueDate, NOW())`,
        {
          academyId,
          studentId: data.studentId,
          month: data.month,
          amount: data.amount,
          status: newStatus,
          paymentMethod: data.paymentMethod,
          dueDate: data.date || new Date().toISOString().slice(0, 10),
        }
      );
      invoiceId = insertRes.insertId;
    }

    // 2. Insert into payment transactions ledger
    const [transRes] = await conn.query(
      `INSERT INTO fee_payments (academy_id, invoice_id, student_id, amount, payment_method, note, payment_date)
       VALUES (:academyId, :invoiceId, :studentId, :amount, :paymentMethod, :note, :paymentDate)`,
      {
        academyId,
        invoiceId,
        studentId: data.studentId,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        note: data.note || null,
        paymentDate: data.date || new Date().toISOString().slice(0, 10),
      }
    );

    // 3. Update student fee_status badge
    const studentStatus = newPaid >= totalDue ? "Paid" : "Pending";
    await conn.query(`UPDATE students SET fee_status = :studentStatus WHERE id = :studentId`, {
      studentStatus,
      studentId: data.studentId,
    });

    return {
      receiptNumber: `REC-${invoiceId}-${transRes.insertId}`,
      invoiceId,
      transactionId: transRes.insertId,
      amount: data.amount,
      status: "Collected",
      paymentMethod: data.paymentMethod,
    };
  });
}

export async function getReceipt(academyId, invoiceId) {
  const records = await query(
    `SELECT f.*, s.full_name AS student_name, s.father_name, s.roll_number, s.parent_phone,
            c.name AS class_name, a.name AS academy_name, a.city AS academy_city
     FROM fee_invoices f
     JOIN students s ON f.student_id = s.id
     JOIN classes c ON s.class_id = c.id
     JOIN academies a ON f.academy_id = a.id
     WHERE f.id = :invoiceId AND f.academy_id = :academyId LIMIT 1`,
    { invoiceId, academyId }
  );

  if (!records || records.length === 0) {
    throw ApiError.notFound("Fee receipt not found.");
  }

  return records[0];
}

export default {
  getFeeInvoices,
  collectFee,
  getReceipt,
};
