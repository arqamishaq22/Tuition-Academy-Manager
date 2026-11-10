import { query } from "../config/db.js";
import ApiError from "../utils/ApiError.js";

/**
 * Helper to fetch teacher's assigned class IDs.
 */
async function getTeacherAssignedClassIds(academyId, userId) {
  const teachers = await query(
    `SELECT id FROM teachers WHERE user_id = :userId AND academy_id = :academyId AND is_active = TRUE LIMIT 1`,
    { userId, academyId }
  );

  if (!teachers || teachers.length === 0) {
    return [];
  }

  const teacherId = teachers[0].id;

  const rows = await query(
    `SELECT DISTINCT c.id
     FROM classes c
     LEFT JOIN class_subjects cs ON cs.class_id = c.id
     WHERE c.academy_id = :academyId
       AND c.deleted_at IS NULL
       AND (c.teacher_id = :teacherId OR cs.teacher_id = :teacherId)`,
    { academyId, teacherId }
  );

  return rows.map((r) => r.id);
}

/**
 * 1. List notices with filters and read counts.
 *
 * @param {number} academyId
 * @param {object} filters
 * @param {object} user
 * @returns {Promise<{ notices: Array<object>, total: number, page: number, limit: number, totalPages: number }>}
 */
export async function getNoticesList(academyId, filters, user) {
  const { audience, classId, q, page = 1, limit = 10 } = filters;
  const offset = (page - 1) * limit;

  let whereClauses = ["n.academy_id = :academyId"];
  const params = { academyId, limit: Number(limit), offset: Number(offset) };

  // Role visibility for teachers
  if (user.role === "teacher") {
    const assignedClassIds = await getTeacherAssignedClassIds(academyId, user.id);
    const classFilter = assignedClassIds.length > 0
      ? `OR (n.audience = 'class' AND n.class_id IN (${assignedClassIds.join(",")}))`
      : "";
    whereClauses.push(
      `(n.created_by = :teacherUserId OR n.audience IN ('all', 'teachers') ${classFilter})`
    );
    params.teacherUserId = user.id;
  }

  if (audience) {
    whereClauses.push("n.audience = :audience");
    params.audience = audience;
  }

  if (classId) {
    whereClauses.push("n.class_id = :classId");
    params.classId = Number(classId);
  }

  if (q) {
    whereClauses.push("(n.title LIKE :search OR n.body LIKE :search)");
    params.search = `%${q}%`;
  }

  const whereSql = whereClauses.join(" AND ");

  // Count total notices
  const countRes = await query(
    `SELECT COUNT(DISTINCT n.id) AS total_count
     FROM notices n
     WHERE ${whereSql}`,
    params
  );
  const total = Number(countRes[0]?.total_count || 0);

  // Fetch notices with read count and author info
  const rows = await query(
    `SELECT 
       n.id,
       n.title,
       n.body,
       n.audience,
       n.class_id,
       c.name AS class_name,
       c.section AS class_section,
       n.is_pinned,
       n.created_at,
       n.updated_at,
       u.id AS author_id,
       u.name AS author_name,
       u.role AS author_role,
       COUNT(DISTINCT nr.user_id) AS read_count
     FROM notices n
     LEFT JOIN classes c ON n.class_id = c.id
     LEFT JOIN users u ON n.created_by = u.id
     LEFT JOIN notice_reads nr ON nr.notice_id = n.id
     WHERE ${whereSql}
     GROUP BY n.id, c.name, c.section, u.id, u.name, u.role
     ORDER BY n.is_pinned DESC, n.created_at DESC
     LIMIT :limit OFFSET :offset`,
    params
  );

  const notices = rows.map((r) => ({
    id: r.id,
    title: r.title,
    body: r.body,
    audience: r.audience,
    classId: r.class_id,
    className: r.class_name ? `${r.class_name}${r.class_section ? " - " + r.class_section : ""}` : null,
    isPinned: Boolean(r.is_pinned),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    author: {
      id: r.author_id,
      name: r.author_name || "Academy",
      role: r.author_role || "staff",
    },
    readCount: Number(r.read_count || 0),
  }));

  const totalPages = Math.ceil(total / limit) || 1;

  return {
    notices,
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages,
  };
}

/**
 * 2. Get notice details by ID with reader list.
 *
 * @param {number} academyId
 * @param {number} noticeId
 * @param {object} user
 * @returns {Promise<object>}
 */
export async function getNoticeById(academyId, noticeId, user) {
  const rows = await query(
    `SELECT 
       n.id,
       n.academy_id,
       n.title,
       n.body,
       n.audience,
       n.class_id,
       c.name AS class_name,
       c.section AS class_section,
       n.is_pinned,
       n.created_at,
       n.updated_at,
       u.id AS author_id,
       u.name AS author_name,
       u.role AS author_role
     FROM notices n
     LEFT JOIN classes c ON n.class_id = c.id
     LEFT JOIN users u ON n.created_by = u.id
     WHERE n.id = :noticeId AND n.academy_id = :academyId LIMIT 1`,
    { noticeId: Number(noticeId), academyId: Number(academyId) }
  );

  if (!rows || rows.length === 0) {
    throw ApiError.notFound("Notice record not found.");
  }

  const n = rows[0];

  // Role access check for teacher
  if (user.role === "teacher") {
    const assigned = await getTeacherAssignedClassIds(academyId, user.id);
    const isAuthor = Number(n.author_id) === Number(user.id);
    const isGeneral = ["all", "teachers"].includes(n.audience);
    const isAssignedClass = n.audience === "class" && assigned.includes(n.class_id);

    if (!isAuthor && !isGeneral && !isAssignedClass) {
      throw ApiError.forbidden("You do not have permission to view this notice.");
    }
  }

  // Automatically record that this user read the notice
  await query(
    `INSERT INTO notice_reads (notice_id, user_id, read_at)
     VALUES (:noticeId, :userId, NOW())
     ON DUPLICATE KEY UPDATE read_at = read_at`,
    { noticeId: n.id, userId: user.id }
  );

  // Fetch read count and list of readers
  const readers = await query(
    `SELECT 
       u.id AS user_id,
       u.name AS user_name,
       u.role AS user_role,
       nr.read_at
     FROM notice_reads nr
     JOIN users u ON nr.user_id = u.id
     WHERE nr.notice_id = :noticeId
     ORDER BY nr.read_at DESC
     LIMIT 50`,
    { noticeId: n.id }
  );

  return {
    id: n.id,
    title: n.title,
    body: n.body,
    audience: n.audience,
    classId: n.class_id,
    className: n.class_name ? `${n.class_name}${n.class_section ? " - " + n.class_section : ""}` : null,
    isPinned: Boolean(n.is_pinned),
    createdAt: n.created_at,
    updatedAt: n.updated_at,
    author: {
      id: n.author_id,
      name: n.author_name || "Academy",
      role: n.author_role || "staff",
    },
    readCount: readers.length,
    recentReaders: readers.map((r) => ({
      userId: r.user_id,
      name: r.user_name,
      role: r.user_role,
      readAt: r.read_at,
    })),
  };
}

/**
 * 3. Create a new notice.
 *
 * @param {number} academyId
 * @param {object} data
 * @param {object} user
 * @returns {Promise<object>}
 */
export async function createNotice(academyId, data, user) {
  const { title, body, audience = "all", classId = null, isPinned = false } = data;

  // 1. Teacher permission check
  if (user.role === "teacher") {
    if (audience !== "class") {
      throw ApiError.forbidden("Teachers may only create notices for their assigned classes.");
    }

    const assigned = await getTeacherAssignedClassIds(academyId, user.id);
    if (!assigned.includes(Number(classId))) {
      throw ApiError.forbidden("You are not assigned to this class.");
    }
  }

  // 2. Class validation if audience is 'class'
  if (audience === "class") {
    if (!classId) {
      throw ApiError.badRequest("classId is required when audience is set to 'class'.");
    }

    const cls = await query(
      `SELECT id, name FROM classes WHERE id = :classId AND academy_id = :academyId AND deleted_at IS NULL LIMIT 1`,
      { classId: Number(classId), academyId }
    );
    if (!cls || cls.length === 0) {
      throw ApiError.badRequest("Selected class does not exist or has been deleted.");
    }
  }

  // 3. Insert notice
  const insertRes = await query(
    `INSERT INTO notices (academy_id, title, body, audience, class_id, created_by, is_pinned)
     VALUES (:academyId, :title, :body, :audience, :classId, :userId, :isPinned)`,
    {
      academyId,
      title: title.trim(),
      body: body.trim(),
      audience,
      classId: audience === "class" ? Number(classId) : null,
      userId: user.id,
      isPinned: Boolean(isPinned),
    }
  );

  const noticeId = insertRes.insertId;

  // 4. Activity log
  await query(
    `INSERT INTO activity_logs (academy_id, user_id, action, entity, entity_id, meta)
     VALUES (:academyId, :userId, 'NOTICE_CREATED', 'notices', :noticeId, :meta)`,
    {
      academyId,
      userId: user.id,
      noticeId,
      meta: JSON.stringify({ title, audience, classId }),
    }
  );

  return await getNoticeById(academyId, noticeId, user);
}

/**
 * 4. Update an existing notice.
 *
 * @param {number} academyId
 * @param {number} noticeId
 * @param {object} data
 * @param {object} user
 * @returns {Promise<object>}
 */
export async function updateNotice(academyId, noticeId, data, user) {
  const rows = await query(
    `SELECT * FROM notices WHERE id = :noticeId AND academy_id = :academyId LIMIT 1`,
    { noticeId: Number(noticeId), academyId }
  );

  if (!rows || rows.length === 0) {
    throw ApiError.notFound("Notice record not found.");
  }

  const existing = rows[0];

  // Teacher check: Teachers can only edit notices they authored
  if (user.role === "teacher") {
    if (Number(existing.created_by) !== Number(user.id)) {
      throw ApiError.forbidden("You do not have permission to edit this notice.");
    }
    if (data.audience && data.audience !== "class") {
      throw ApiError.forbidden("Teachers may only publish notices for their assigned classes.");
    }
    if (data.classId) {
      const assigned = await getTeacherAssignedClassIds(academyId, user.id);
      if (!assigned.includes(Number(data.classId))) {
        throw ApiError.forbidden("You are not assigned to this class.");
      }
    }
  }

  const newAudience = data.audience !== undefined ? data.audience : existing.audience;
  let newClassId = data.classId !== undefined ? data.classId : existing.class_id;
  if (newAudience !== "class") {
    newClassId = null;
  }

  if (newAudience === "class") {
    if (!newClassId) {
      throw ApiError.badRequest("classId is required when audience is set to 'class'.");
    }
    const cls = await query(
      `SELECT id FROM classes WHERE id = :classId AND academy_id = :academyId AND deleted_at IS NULL LIMIT 1`,
      { classId: Number(newClassId), academyId }
    );
    if (!cls || cls.length === 0) {
      throw ApiError.badRequest("Selected class does not exist or has been deleted.");
    }
  }

  await query(
    `UPDATE notices SET
       title = :title,
       body = :body,
       audience = :audience,
       class_id = :classId,
       is_pinned = :isPinned
     WHERE id = :noticeId AND academy_id = :academyId`,
    {
      title: data.title !== undefined ? data.title.trim() : existing.title,
      body: data.body !== undefined ? data.body.trim() : existing.body,
      audience: newAudience,
      classId: newClassId ? Number(newClassId) : null,
      isPinned: data.isPinned !== undefined ? Boolean(data.isPinned) : existing.is_pinned,
      noticeId,
      academyId,
    }
  );

  return await getNoticeById(academyId, noticeId, user);
}

/**
 * 5. Delete a notice.
 *
 * @param {number} academyId
 * @param {number} noticeId
 * @param {object} user
 * @returns {Promise<{ message: string, deletedNoticeId: number }>}
 */
export async function deleteNotice(academyId, noticeId, user) {
  const rows = await query(
    `SELECT * FROM notices WHERE id = :noticeId AND academy_id = :academyId LIMIT 1`,
    { noticeId: Number(noticeId), academyId }
  );

  if (!rows || rows.length === 0) {
    throw ApiError.notFound("Notice record not found.");
  }

  const existing = rows[0];

  // Teacher check: can only delete their own notices
  if (user.role === "teacher" && Number(existing.created_by) !== Number(user.id)) {
    throw ApiError.forbidden("You do not have permission to delete this notice.");
  }

  await query(
    `DELETE FROM notices WHERE id = :noticeId AND academy_id = :academyId`,
    { noticeId, academyId }
  );

  return {
    message: "Notice deleted successfully.",
    deletedNoticeId: Number(noticeId),
  };
}

/**
 * 6. Toggle or update pinned status of a notice.
 *
 * @param {number} academyId
 * @param {number} noticeId
 * @param {object} user
 * @param {boolean|null} isPinned
 * @returns {Promise<object>}
 */
export async function togglePinNotice(academyId, noticeId, user, isPinned = null) {
  const rows = await query(
    `SELECT * FROM notices WHERE id = :noticeId AND academy_id = :academyId LIMIT 1`,
    { noticeId: Number(noticeId), academyId }
  );

  if (!rows || rows.length === 0) {
    throw ApiError.notFound("Notice record not found.");
  }

  const existing = rows[0];

  if (user.role === "teacher" && Number(existing.created_by) !== Number(user.id)) {
    throw ApiError.forbidden("You do not have permission to pin/unpin this notice.");
  }

  const nextState = isPinned !== null && isPinned !== undefined ? Boolean(isPinned) : !existing.is_pinned;

  await query(
    `UPDATE notices SET is_pinned = :nextState WHERE id = :noticeId AND academy_id = :academyId`,
    { nextState, noticeId, academyId }
  );

  return {
    id: Number(noticeId),
    title: existing.title,
    isPinned: nextState,
    message: nextState ? "Notice pinned to top." : "Notice unpinned.",
  };
}

export default {
  getNoticesList,
  getNoticeById,
  createNotice,
  updateNotice,
  deleteNotice,
  togglePinNotice,
};
