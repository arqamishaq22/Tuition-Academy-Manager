import { query } from "../config/db.js";
import ApiError from "./ApiError.js";

/**
 * Reusable security assertion for the Parent Portal.
 * Verifies that the given studentId belongs to the logged-in parent in the parent_students table,
 * matches the academyId, and has not been deleted.
 *
 * CRITICAL PRIVACY & SECURITY RULE:
 * If the student does not belong to the parent, returns 404 (Not Found) rather than 403,
 * preventing malicious actors or parents from enumerating valid student IDs.
 *
 * @param {number} parentId - User ID of the logged-in parent
 * @param {number} studentId - Student ID to verify
 * @param {number} academyId - Tenant Academy ID
 * @returns {Promise<object>} - Validated student record
 */
export async function assertParentOwnsStudent(parentId, studentId, academyId) {
  const pId = Number(parentId);
  const sId = Number(studentId);
  const aId = Number(academyId);

  if (!pId || !sId || !aId) {
    throw ApiError.notFound("Student record not found or not associated with your account.");
  }

  const rows = await query(
    `SELECT 
       s.id,
       s.academy_id,
       s.class_id,
       s.roll_no,
       s.name,
       s.father_name,
       s.parent_phone,
       s.monthly_fee,
       s.discount,
       s.status,
       s.photo_url,
       c.name AS class_name,
       c.section AS class_section,
       c.timing_start,
       c.timing_end,
       t.name AS class_teacher_name
     FROM parent_students ps
     JOIN students s ON ps.student_id = s.id
     JOIN classes c ON s.class_id = c.id
     LEFT JOIN teachers t ON c.teacher_id = t.id
     WHERE ps.parent_user_id = :pId
       AND ps.student_id = :sId
       AND s.academy_id = :aId
       AND s.deleted_at IS NULL
     LIMIT 1`,
    { pId, sId, aId }
  );

  if (!rows || rows.length === 0) {
    throw ApiError.notFound("Student record not found or not associated with your account.");
  }

  return rows[0];
}

export default {
  assertParentOwnsStudent,
};

