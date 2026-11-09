import { query, withTransaction } from "../config/db.js";
import ApiError from "../utils/ApiError.js";

/**
 * Helper to fetch teacher ID from user ID
 */
async function getTeacherIdForUser(academyId, userId) {
  const teachers = await query(
    `SELECT id FROM teachers WHERE user_id = :userId AND academy_id = :academyId AND is_active = TRUE LIMIT 1`,
    { userId, academyId }
  );
  return teachers[0]?.id || null;
}

// ============================================================================
// 1. GET ALL CLASSES
// ============================================================================
export async function getAllClasses(academyId, options = {}, user = null) {
  const { q, limit = 10, offset = 0 } = options;

  let teacherId = null;
  if (user && user.role === "teacher") {
    teacherId = await getTeacherIdForUser(academyId, user.id);
    if (!teacherId) {
      return { classes: [], total: 0 };
    }
  }

  const whereClauses = ["c.academy_id = :academyId", "c.deleted_at IS NULL"];
  const params = { academyId };

  if (teacherId) {
    whereClauses.push(
      "(c.teacher_id = :teacherId OR c.id IN (SELECT class_id FROM class_subjects WHERE teacher_id = :teacherId))"
    );
    params.teacherId = teacherId;
  }

  if (q && q.trim()) {
    whereClauses.push("(c.name LIKE :search OR c.section LIKE :search)");
    params.search = `%${q.trim()}%`;
  }

  const whereSql = whereClauses.join(" AND ");

  // Count total classes
  const countSql = `SELECT COUNT(c.id) AS total FROM classes c WHERE ${whereSql}`;
  const countRows = await query(countSql, params);
  const total = countRows[0]?.total || 0;

  // Main select query with student counts and attendance stats
  const sql = `
    SELECT 
      c.id,
      c.academy_id,
      c.name,
      c.section,
      c.timing_start,
      c.timing_end,
      c.days_of_week,
      c.monthly_fee,
      c.capacity,
      c.is_active,
      c.created_at,
      t.id AS teacher_id,
      t.name AS teacher_name,
      COALESCE(sc.student_count, 0) AS student_count,
      COALESCE(today_att.today_attendance_pct, 0) AS today_attendance_pct,
      COALESCE(month_att.monthly_attendance_pct, 0) AS monthly_attendance_pct
    FROM classes c
    LEFT JOIN teachers t ON c.teacher_id = t.id
    LEFT JOIN (
      SELECT class_id, COUNT(*) AS student_count
      FROM students
      WHERE academy_id = :academyId AND status = 'active' AND deleted_at IS NULL
      GROUP BY class_id
    ) sc ON sc.class_id = c.id
    LEFT JOIN (
      SELECT 
        class_id,
        ROUND((SUM(CASE WHEN status IN ('present', 'late') THEN 1 ELSE 0 END) / COUNT(*)) * 100, 1) AS today_attendance_pct
      FROM attendance
      WHERE academy_id = :academyId AND date = CURRENT_DATE()
      GROUP BY class_id
    ) today_att ON today_att.class_id = c.id
    LEFT JOIN (
      SELECT 
        class_id,
        ROUND((SUM(CASE WHEN status IN ('present', 'late') THEN 1 ELSE 0 END) / COUNT(*)) * 100, 1) AS monthly_attendance_pct
      FROM attendance
      WHERE academy_id = :academyId 
        AND MONTH(date) = MONTH(CURRENT_DATE()) 
        AND YEAR(date) = YEAR(CURRENT_DATE())
      GROUP BY class_id
    ) month_att ON month_att.class_id = c.id
    WHERE ${whereSql}
    ORDER BY c.name ASC, c.section ASC
    LIMIT :limit OFFSET :offset
  `;

  params.limit = limit;
  params.offset = offset;

  const classes = await query(sql, params);

  return { classes, total };
}

// ============================================================================
// 2. GET CLASS BY ID
// ============================================================================
export async function getClassById(academyId, classId, user = null) {
  let teacherId = null;
  if (user && user.role === "teacher") {
    teacherId = await getTeacherIdForUser(academyId, user.id);
    if (!teacherId) {
      throw ApiError.notFound("Class not found or not assigned to you.");
    }
  }

  let sql = `
    SELECT 
      c.*,
      t.name AS teacher_name,
      t.phone AS teacher_phone
    FROM classes c
    LEFT JOIN teachers t ON c.teacher_id = t.id
    WHERE c.id = :classId AND c.academy_id = :academyId AND c.deleted_at IS NULL
  `;
  const params = { classId, academyId };

  if (teacherId) {
    sql += ` AND (c.teacher_id = :teacherId OR c.id IN (SELECT class_id FROM class_subjects WHERE teacher_id = :teacherId))`;
    params.teacherId = teacherId;
  }
  sql += ` LIMIT 1`;

  const rows = await query(sql, params);
  if (!rows || rows.length === 0) {
    throw ApiError.notFound("Class record not found.");
  }
  const cls = rows[0];

  // 1. Fetch Students currently enrolled in this class
  const students = await query(
    `SELECT id, roll_no, name, father_name, gender, phone, parent_phone, status, admission_date, photo_url
     FROM students
     WHERE class_id = :classId AND academy_id = :academyId AND deleted_at IS NULL
     ORDER BY CAST(roll_no AS UNSIGNED) ASC`,
    { classId, academyId }
  );

  // 2. Fetch Subjects and assigned Teachers
  const subjects = await query(
    `SELECT 
       s.id AS subject_id,
       s.name AS subject_name,
       t.id AS teacher_id,
       t.name AS teacher_name,
       t.phone AS teacher_phone
     FROM class_subjects cs
     JOIN subjects s ON cs.subject_id = s.id
     LEFT JOIN teachers t ON cs.teacher_id = t.id
     WHERE cs.class_id = :classId
     ORDER BY s.name ASC`,
    { classId }
  );

  return {
    ...cls,
    studentCount: students.length,
    students,
    subjects,
  };
}

// ============================================================================
// 3. CREATE CLASS
// ============================================================================
export async function createClass(academyId, data, currentUserId = null) {
  // If teacher_id provided, verify it belongs to academy
  if (data.teacherId) {
    const tCheck = await query(
      `SELECT id FROM teachers WHERE id = :teacherId AND academy_id = :academyId AND is_active = TRUE LIMIT 1`,
      { teacherId: data.teacherId, academyId }
    );
    if (!tCheck || tCheck.length === 0) {
      throw ApiError.badRequest("Selected teacher not found or inactive.");
    }
  }

  const result = await query(
    `INSERT INTO classes (
       academy_id, name, section, timing_start, timing_end, days_of_week, monthly_fee, teacher_id, capacity
     ) VALUES (
       :academyId, :name, :section, :timingStart, :timingEnd, :daysOfWeek, :monthlyFee, :teacherId, :capacity
     )`,
    {
      academyId,
      name: data.name,
      section: data.section || null,
      timingStart: data.timingStart,
      timingEnd: data.timingEnd,
      daysOfWeek: data.daysOfWeek || "Mon,Tue,Wed,Thu,Fri,Sat",
      monthlyFee: data.monthlyFee !== undefined ? data.monthlyFee : 3500,
      teacherId: data.teacherId || null,
      capacity: data.capacity !== undefined ? data.capacity : 40,
    }
  );

  const classId = result.insertId;

  await query(
    `INSERT INTO activity_logs (academy_id, user_id, action, entity, entity_id, meta)
     VALUES (:academyId, :userId, 'CLASS_CREATED', 'classes', :classId, :meta)`,
    {
      academyId,
      userId: currentUserId,
      classId,
      meta: JSON.stringify({ name: data.name, section: data.section }),
    }
  );

  return await getClassById(academyId, classId);
}

// ============================================================================
// 4. UPDATE CLASS
// ============================================================================
export async function updateClass(academyId, classId, data, currentUserId = null) {
  await getClassById(academyId, classId);

  if (data.teacherId) {
    const tCheck = await query(
      `SELECT id FROM teachers WHERE id = :teacherId AND academy_id = :academyId AND is_active = TRUE LIMIT 1`,
      { teacherId: data.teacherId, academyId }
    );
    if (!tCheck || tCheck.length === 0) {
      throw ApiError.badRequest("Selected teacher not found or inactive.");
    }
  }

  const fields = [];
  const params = { classId, academyId };

  const fieldMap = {
    name: "name",
    section: "section",
    timingStart: "timing_start",
    timingEnd: "timing_end",
    daysOfWeek: "days_of_week",
    monthlyFee: "monthly_fee",
    teacherId: "teacher_id",
    capacity: "capacity",
  };

  for (const [key, dbCol] of Object.entries(fieldMap)) {
    if (data[key] !== undefined) {
      fields.push(`${dbCol} = :${key}`);
      params[key] = data[key];
    }
  }

  if (fields.length > 0) {
    await query(
      `UPDATE classes SET ${fields.join(", ")} WHERE id = :classId AND academy_id = :academyId`,
      params
    );
  }

  await query(
    `INSERT INTO activity_logs (academy_id, user_id, action, entity, entity_id, meta)
     VALUES (:academyId, :userId, 'CLASS_UPDATED', 'classes', :classId, :meta)`,
    {
      academyId,
      userId: currentUserId,
      classId,
      meta: JSON.stringify(data),
    }
  );

  return await getClassById(academyId, classId);
}

// ============================================================================
// 5. DELETE CLASS (Soft Delete with Safety Guard)
// ============================================================================
export async function deleteClass(academyId, classId, force = false, currentUserId = null) {
  const cls = await getClassById(academyId, classId);

  // Check active students enrolled in class
  const studentRows = await query(
    `SELECT COUNT(*) AS count FROM students 
     WHERE class_id = :classId AND academy_id = :academyId AND status = 'active' AND deleted_at IS NULL`,
    { classId, academyId }
  );
  const activeStudents = studentRows[0]?.count || 0;

  if (activeStudents > 0 && !force) {
    throw ApiError.badRequest(
      `Cannot delete class '${cls.name}': There are ${activeStudents} active student(s) enrolled. Please move students to another class or append ?force=true to archive.`
    );
  }

  // Soft delete class
  await query(
    `UPDATE classes SET deleted_at = NOW(), is_active = FALSE WHERE id = :classId AND academy_id = :academyId`,
    { classId, academyId }
  );

  await query(
    `INSERT INTO activity_logs (academy_id, user_id, action, entity, entity_id, meta)
     VALUES (:academyId, :userId, 'CLASS_DELETED', 'classes', :classId, :meta)`,
    {
      academyId,
      userId: currentUserId,
      classId,
      meta: JSON.stringify({ name: cls.name, activeStudents, forced: force }),
    }
  );

  return { message: `Class '${cls.name}' has been soft-deleted and archived.` };
}

// ============================================================================
// 6. ASSIGN & REMOVE CLASS SUBJECTS
// ============================================================================
export async function assignSubject(academyId, classId, subjectId, teacherId = null, currentUserId = null) {
  // Verify class
  await getClassById(academyId, classId);

  // Verify subject belongs to academy
  const sCheck = await query(
    `SELECT id, name FROM subjects WHERE id = :subjectId AND academy_id = :academyId LIMIT 1`,
    { subjectId, academyId }
  );
  if (!sCheck || sCheck.length === 0) {
    throw ApiError.notFound("Subject not found in this academy.");
  }

  // Verify teacher if passed
  if (teacherId) {
    const tCheck = await query(
      `SELECT id, name FROM teachers WHERE id = :teacherId AND academy_id = :academyId AND is_active = TRUE LIMIT 1`,
      { teacherId, academyId }
    );
    if (!tCheck || tCheck.length === 0) {
      throw ApiError.badRequest("Selected teacher not found or inactive.");
    }
  }

  await query(
    `INSERT INTO class_subjects (class_id, subject_id, teacher_id)
     VALUES (:classId, :subjectId, :teacherId)
     ON DUPLICATE KEY UPDATE teacher_id = VALUES(teacher_id)`,
    { classId, subjectId, teacherId: teacherId || null }
  );

  await query(
    `INSERT INTO activity_logs (academy_id, user_id, action, entity, entity_id, meta)
     VALUES (:academyId, :userId, 'CLASS_SUBJECT_ASSIGNED', 'class_subjects', :classId, :meta)`,
    {
      academyId,
      userId: currentUserId,
      classId,
      meta: JSON.stringify({ subjectId, teacherId }),
    }
  );

  return await getClassById(academyId, classId);
}

export async function removeSubject(academyId, classId, subjectId, currentUserId = null) {
  await getClassById(academyId, classId);

  await query(
    `DELETE FROM class_subjects WHERE class_id = :classId AND subject_id = :subjectId`,
    { classId, subjectId }
  );

  await query(
    `INSERT INTO activity_logs (academy_id, user_id, action, entity, entity_id, meta)
     VALUES (:academyId, :userId, 'CLASS_SUBJECT_REMOVED', 'class_subjects', :classId, :meta)`,
    {
      academyId,
      userId: currentUserId,
      classId,
      meta: JSON.stringify({ subjectId }),
    }
  );

  return { message: "Subject removed from class successfully." };
}

// ============================================================================
// 7. ACADEMY SUBJECTS (List & Create)
// ============================================================================
export async function getAcademySubjects(academyId) {
  return await query(
    `SELECT id, name, created_at FROM subjects WHERE academy_id = :academyId ORDER BY name ASC`,
    { academyId }
  );
}

export async function createAcademySubject(academyId, name, currentUserId = null) {
  const trimmed = name.trim();
  const existing = await query(
    `SELECT id FROM subjects WHERE academy_id = :academyId AND name = :name LIMIT 1`,
    { academyId, name: trimmed }
  );
  if (existing && existing.length > 0) {
    throw ApiError.conflict(`Subject '${trimmed}' already exists in this academy.`);
  }

  const result = await query(
    `INSERT INTO subjects (academy_id, name) VALUES (:academyId, :name)`,
    { academyId, name: trimmed }
  );

  const subjectId = result.insertId;

  await query(
    `INSERT INTO activity_logs (academy_id, user_id, action, entity, entity_id, meta)
     VALUES (:academyId, :userId, 'SUBJECT_CREATED', 'subjects', :subjectId, :meta)`,
    {
      academyId,
      userId: currentUserId,
      subjectId,
      meta: JSON.stringify({ name: trimmed }),
    }
  );

  return { id: subjectId, academyId, name: trimmed };
}

export default {
  getAllClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
  assignSubject,
  removeSubject,
  getAcademySubjects,
  createAcademySubject,
};
