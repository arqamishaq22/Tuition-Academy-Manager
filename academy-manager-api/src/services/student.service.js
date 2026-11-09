import { query } from "../config/db.js";
import ApiError from "../utils/ApiError.js";

export async function getAllStudents(academyId, { search, classId, feeStatus, limit, offset }) {
  let sql = `
    SELECT s.id, s.full_name, s.father_name, s.roll_number, s.phone, s.parent_phone, 
           s.monthly_fee, s.fee_status, s.attendance_pct, s.admission_date,
           c.name AS class_name, c.id AS class_id
    FROM students s
    JOIN classes c ON s.class_id = c.id
    WHERE s.academy_id = :academyId
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

  if (feeStatus && feeStatus !== "All") {
    sql += ` AND s.fee_status = :feeStatus`;
    params.feeStatus = feeStatus;
  }

  // Count total for pagination
  const countSql = `SELECT COUNT(*) AS total FROM (${sql}) AS sub`;
  const countRes = await query(countSql, params);
  const total = countRes[0]?.total || 0;

  sql += ` ORDER BY s.id DESC LIMIT :limit OFFSET :offset`;
  params.limit = limit;
  params.offset = offset;

  const students = await query(sql, params);
  return { students, total };
}

export async function getStudentById(academyId, id) {
  const students = await query(
    `SELECT s.*, c.name AS class_name
     FROM students s
     JOIN classes c ON s.class_id = c.id
     WHERE s.id = :id AND s.academy_id = :academyId LIMIT 1`,
    { id, academyId }
  );

  if (!students || students.length === 0) {
    throw ApiError.notFound("Student record not found.");
  }

  return students[0];
}

export async function createStudent(academyId, data) {
  const result = await query(
    `INSERT INTO students (academy_id, class_id, full_name, father_name, roll_number, phone, parent_phone, address, monthly_fee, admission_date)
     VALUES (:academyId, :classId, :fullName, :fatherName, :rollNumber, :phone, :parentPhone, :address, :monthlyFee, :admissionDate)`,
    {
      academyId,
      classId: data.classId,
      fullName: data.fullName,
      fatherName: data.fatherName,
      rollNumber: data.rollNumber,
      phone: data.phone,
      parentPhone: data.parentPhone,
      address: data.address || null,
      monthlyFee: data.monthlyFee,
      admissionDate: data.admissionDate || new Date().toISOString().slice(0, 10),
    }
  );

  return { id: result.insertId, ...data };
}

export async function updateStudent(academyId, id, data) {
  await getStudentById(academyId, id); // Verify existence

  const fields = [];
  const params = { id, academyId };

  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined) {
      const dbCol = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
      fields.push(`${dbCol} = :${key}`);
      params[key] = val;
    }
  }

  if (fields.length > 0) {
    await query(
      `UPDATE students SET ${fields.join(", ")} WHERE id = :id AND academy_id = :academyId`,
      params
    );
  }

  return await getStudentById(academyId, id);
}

export async function deleteStudent(academyId, id) {
  await getStudentById(academyId, id);
  await query("DELETE FROM students WHERE id = :id AND academy_id = :academyId", {
    id,
    academyId,
  });
  return { message: "Student record deleted successfully" };
}

export default {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
};
