import bcrypt from "bcryptjs";
import { query, withTransaction } from "../config/db.js";
import ApiError from "../utils/ApiError.js";
import { normalizePakistaniPhone } from "../utils/phone.js";

// ============================================================================
// 1. GET ALL TEACHERS
// ============================================================================
export async function getAllTeachers(academyId, options = {}) {
  const { q, limit = 10, offset = 0 } = options;

  const whereClauses = ["t.academy_id = :academyId"];
  const params = { academyId };

  if (q && q.trim()) {
    whereClauses.push(
      "(t.name LIKE :search OR t.phone LIKE :search OR t.email LIKE :search OR t.subject LIKE :search)"
    );
    params.search = `%${q.trim()}%`;
  }

  const whereSql = whereClauses.join(" AND ");

  // Count total teachers
  const countSql = `SELECT COUNT(t.id) AS total FROM teachers t WHERE ${whereSql}`;
  const countRows = await query(countSql, params);
  const total = countRows[0]?.total || 0;

  // Main select with assigned class and subject counts
  const sql = `
    SELECT 
      t.id,
      t.academy_id,
      t.user_id,
      t.name,
      t.phone,
      t.email,
      t.qualification,
      t.subject,
      t.salary,
      t.joined_on,
      t.is_active,
      t.created_at,
      u.email AS user_account_email,
      COALESCE(c_count.assigned_class_count, 0) AS assigned_class_count,
      COALESCE(s_count.assigned_subject_count, 0) AS assigned_subject_count
    FROM teachers t
    LEFT JOIN users u ON t.user_id = u.id
    LEFT JOIN (
      SELECT teacher_id, COUNT(DISTINCT class_id) AS assigned_class_count
      FROM (
        SELECT id AS class_id, teacher_id FROM classes WHERE deleted_at IS NULL AND teacher_id IS NOT NULL
        UNION
        SELECT class_id, teacher_id FROM class_subjects WHERE teacher_id IS NOT NULL
      ) active_assignments
      GROUP BY teacher_id
    ) c_count ON c_count.teacher_id = t.id
    LEFT JOIN (
      SELECT teacher_id, COUNT(DISTINCT subject_id) AS assigned_subject_count
      FROM class_subjects
      WHERE teacher_id IS NOT NULL
      GROUP BY teacher_id
    ) s_count ON s_count.teacher_id = t.id
    WHERE ${whereSql}
    ORDER BY t.name ASC
    LIMIT :limit OFFSET :offset
  `;

  params.limit = limit;
  params.offset = offset;

  const teachers = await query(sql, params);

  return { teachers, total };
}

// ============================================================================
// 2. GET TEACHER BY ID
// ============================================================================
export async function getTeacherById(academyId, teacherId) {
  const rows = await query(
    `SELECT 
       t.*,
       u.email AS user_account_email,
       u.is_active AS user_account_active
     FROM teachers t
     LEFT JOIN users u ON t.user_id = u.id
     WHERE t.id = :teacherId AND t.academy_id = :academyId LIMIT 1`,
    { teacherId, academyId }
  );

  if (!rows || rows.length === 0) {
    throw ApiError.notFound("Teacher record not found.");
  }

  const teacher = rows[0];

  // Assigned classes as Primary Class Teacher
  const classTeacherOf = await query(
    `SELECT id AS class_id, name AS class_name, section, timing_start, timing_end, capacity
     FROM classes
     WHERE teacher_id = :teacherId AND academy_id = :academyId AND deleted_at IS NULL
     ORDER BY name ASC`,
    { teacherId, academyId }
  );

  // Assigned class subjects
  const subjectAssignments = await query(
    `SELECT 
       c.id AS class_id,
       c.name AS class_name,
       c.section AS class_section,
       s.id AS subject_id,
       s.name AS subject_name
     FROM class_subjects cs
     JOIN classes c ON cs.class_id = c.id
     JOIN subjects s ON cs.subject_id = s.id
     WHERE cs.teacher_id = :teacherId AND c.academy_id = :academyId AND c.deleted_at IS NULL
     ORDER BY c.name ASC, s.name ASC`,
    { teacherId, academyId }
  );

  return {
    ...teacher,
    classTeacherOf,
    subjectAssignments,
  };
}

// ============================================================================
// 3. CREATE TEACHER (Optional User Account Creation)
// ============================================================================
export async function createTeacher(academyId, data, currentUserId = null) {
  let createdTeacherId = null;
  await withTransaction(async (conn) => {
    let userId = null;

    // Normalize phone
    const phone = normalizePakistaniPhone(data.phone);

    // If login account requested
    if (data.createAccount) {
      if (!data.email) {
        throw ApiError.badRequest("Email is required when creating a teacher login account.");
      }

      // Check email uniqueness within academy
      const [existingUser] = await conn.query(
        `SELECT id FROM users WHERE academy_id = :academyId AND email = :email AND deleted_at IS NULL LIMIT 1`,
        { academyId, email: data.email }
      );
      if (existingUser && existingUser.length > 0) {
        throw ApiError.conflict("A user account with this email already exists in this academy.");
      }

      const rawPassword = data.password || "Teacher@1234";
      const passwordHash = await bcrypt.hash(rawPassword, 12);

      const [userResult] = await conn.query(
        `INSERT INTO users (
           academy_id, name, email, phone, password_hash, role, is_active
         ) VALUES (
           :academyId, :name, :email, :phone, :passwordHash, 'teacher', TRUE
         )`,
        {
          academyId,
          name: data.name,
          email: data.email,
          phone,
          passwordHash,
        }
      );
      userId = userResult.insertId;
    }

    // Insert Teacher
    const [teacherResult] = await conn.query(
      `INSERT INTO teachers (
         academy_id, user_id, name, phone, email, qualification, subject, salary, joined_on, is_active
       ) VALUES (
         :academyId, :userId, :name, :phone, :email, :qualification, :subject, :salary, :joinedOn, TRUE
       )`,
      {
        academyId,
        userId,
        name: data.name,
        phone,
        email: data.email || null,
        qualification: data.qualification || null,
        subject: data.subject || null,
        salary: data.salary || null,
        joinedOn: data.joinedOn || new Date().toISOString().slice(0, 10),
      }
    );

    const teacherId = teacherResult.insertId;

    // Log Activity
    await conn.query(
      `INSERT INTO activity_logs (academy_id, user_id, action, entity, entity_id, meta)
       VALUES (:academyId, :userId, 'TEACHER_CREATED', 'teachers', :teacherId, :meta)`,
      {
        academyId,
        userId: currentUserId,
        teacherId,
        meta: JSON.stringify({
          name: data.name,
          phone,
          email: data.email,
          hasAccount: Boolean(userId),
        }),
      }
    );

    createdTeacherId = teacherId;
  });

  return await getTeacherById(academyId, createdTeacherId);
}

// ============================================================================
// 4. UPDATE TEACHER
// ============================================================================
export async function updateTeacher(academyId, teacherId, data, currentUserId = null) {
  await withTransaction(async (conn) => {
    const [existing] = await conn.query(
      `SELECT * FROM teachers WHERE id = :teacherId AND academy_id = :academyId LIMIT 1`,
      { teacherId, academyId }
    );
    if (!existing || existing.length === 0) {
      throw ApiError.notFound("Teacher record not found.");
    }
    const currentTeacher = existing[0];

    const fields = [];
    const params = { teacherId, academyId };

    const fieldMap = {
      name: "name",
      phone: "phone",
      email: "email",
      qualification: "qualification",
      subject: "subject",
      salary: "salary",
      joinedOn: "joined_on",
      isActive: "is_active",
    };

    for (const [key, dbCol] of Object.entries(fieldMap)) {
      if (data[key] !== undefined) {
        fields.push(`${dbCol} = :${key}`);
        params[key] = key === "phone" ? normalizePakistaniPhone(data[key]) : data[key];
      }
    }

    if (fields.length > 0) {
      await conn.query(
        `UPDATE teachers SET ${fields.join(", ")} WHERE id = :teacherId AND academy_id = :academyId`,
        params
      );
    }

    // Keep linked user record in sync if name, phone, or active status changed
    if (currentTeacher.user_id) {
      const userUpdates = [];
      const userParams = { userId: currentTeacher.user_id };

      if (data.name) {
        userUpdates.push("name = :name");
        userParams.name = data.name;
      }
      if (data.phone) {
        userUpdates.push("phone = :phone");
        userParams.phone = normalizePakistaniPhone(data.phone);
      }
      if (data.isActive !== undefined) {
        userUpdates.push("is_active = :isActive");
        userParams.isActive = data.isActive;
      }

      if (userUpdates.length > 0) {
        await conn.query(
          `UPDATE users SET ${userUpdates.join(", ")} WHERE id = :userId`,
          userParams
        );
      }
    }

    await conn.query(
      `INSERT INTO activity_logs (academy_id, user_id, action, entity, entity_id, meta)
       VALUES (:academyId, :userId, 'TEACHER_UPDATED', 'teachers', :teacherId, :meta)`,
      {
        academyId,
        userId: currentUserId,
        teacherId,
        meta: JSON.stringify(data),
      }
    );
  });

  return await getTeacherById(academyId, teacherId);
}

// ============================================================================
// 5. DELETE / DEACTIVATE TEACHER
// ============================================================================
export async function deleteTeacher(academyId, teacherId, currentUserId = null) {
  const teacher = await getTeacherById(academyId, teacherId);

  // Soft delete / deactivate teacher
  await query(
    `UPDATE teachers SET is_active = FALSE WHERE id = :teacherId AND academy_id = :academyId`,
    { teacherId, academyId }
  );

  // Deactivate linked user account if exists
  if (teacher.user_id) {
    await query(`UPDATE users SET is_active = FALSE WHERE id = :userId`, {
      userId: teacher.user_id,
    });
  }

  // Clear class teacher references
  await query(
    `UPDATE classes SET teacher_id = NULL WHERE teacher_id = :teacherId AND academy_id = :academyId`,
    { teacherId, academyId }
  );

  // Clear subject teacher references
  await query(
    `UPDATE class_subjects cs
     JOIN classes c ON cs.class_id = c.id
     SET cs.teacher_id = NULL
     WHERE cs.teacher_id = :teacherId AND c.academy_id = :academyId`,
    { teacherId, academyId }
  );

  await query(
    `INSERT INTO activity_logs (academy_id, user_id, action, entity, entity_id, meta)
     VALUES (:academyId, :userId, 'TEACHER_DEACTIVATED', 'teachers', :teacherId, :meta)`,
    {
      academyId,
      userId: currentUserId,
      teacherId,
      meta: JSON.stringify({ name: teacher.name }),
    }
  );

  return { message: `Teacher '${teacher.name}' has been deactivated and unassigned from active classes.` };
}

export default {
  getAllTeachers,
  getTeacherById,
  createTeacher,
  updateTeacher,
  deleteTeacher,
};
