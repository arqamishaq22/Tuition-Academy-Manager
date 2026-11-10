import bcrypt from "bcryptjs";
import { query, withTransaction } from "../config/db.js";
import ApiError from "../utils/ApiError.js";
import { clearDashboardCache } from "../utils/cache.js";
import { normalizePakistaniPhone, formatPakistaniPhone } from "../utils/phone.js";

/**
 * Helper to get assigned class IDs for a teacher.
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
 * Helper to compute grade from percentage.
 */
function calculateGrade(percentage) {
  if (percentage >= 80) return "A+";
  if (percentage >= 70) return "A";
  if (percentage >= 60) return "B";
  if (percentage >= 50) return "C";
  if (percentage >= 40) return "D";
  return "F";
}

// ============================================================================
// 1. GET ALL STUDENTS
// ============================================================================
export async function getAllStudents(academyId, options = {}, user = null) {
  const {
    q,
    classId,
    status = "active",
    feeStatus,
    sortBy = "created_at",
    order = "desc",
    limit = 10,
    offset = 0,
  } = options;

  let assignedClassIds = null;
  if (user && user.role === "teacher") {
    assignedClassIds = await getTeacherAssignedClassIds(academyId, user.id);
    if (assignedClassIds.length === 0) {
      return { students: [], total: 0 };
    }
  }

  const whereClauses = ["s.academy_id = :academyId", "s.deleted_at IS NULL"];
  const params = { academyId };

  // Teacher class restriction
  if (assignedClassIds) {
    whereClauses.push(`s.class_id IN (${assignedClassIds.join(",")})`);
  }

  // Filter by Class ID
  if (classId) {
    whereClauses.push("s.class_id = :classId");
    params.classId = parseInt(classId, 10);
  }

  // Filter by Status
  if (status && status !== "all") {
    whereClauses.push("s.status = :status");
    params.status = status;
  }

  // Search by name, father name, roll no, or phone
  if (q && q.trim()) {
    whereClauses.push(
      "(s.name LIKE :search OR s.father_name LIKE :search OR s.roll_no LIKE :search OR s.phone LIKE :search OR s.parent_phone LIKE :search)"
    );
    params.search = `%${q.trim()}%`;
  }

  // Filter by Fee Status for current month
  if (feeStatus && feeStatus !== "all") {
    whereClauses.push("COALESCE(cur_fee.status, 'unbilled') = :feeStatus");
    params.feeStatus = feeStatus;
  }

  // Whitelist sort columns
  const allowedSortCols = {
    name: "s.name",
    roll_no: "CAST(s.roll_no AS UNSIGNED)",
    created_at: "s.created_at",
  };
  const sortCol = allowedSortCols[sortBy] || "s.created_at";
  const sortOrder = order.toLowerCase() === "asc" ? "ASC" : "DESC";

  const whereSql = whereClauses.join(" AND ");

  // Count query
  const countSql = `
    SELECT COUNT(s.id) AS total
    FROM students s
    LEFT JOIN fees cur_fee 
      ON cur_fee.student_id = s.id 
      AND cur_fee.month = MONTH(CURRENT_DATE()) 
      AND cur_fee.year = YEAR(CURRENT_DATE())
    WHERE ${whereSql}
  `;
  const countRows = await query(countSql, params);
  const total = countRows[0]?.total || 0;

  // Main select query with current month attendance & fee status
  const sql = `
    SELECT 
      s.id,
      s.academy_id,
      s.class_id,
      s.roll_no,
      s.name,
      s.father_name,
      s.gender,
      s.date_of_birth,
      s.phone,
      s.parent_phone,
      s.address,
      s.monthly_fee,
      s.discount,
      s.photo_url,
      s.admission_date,
      s.status,
      s.created_at,
      c.name AS class_name,
      c.section AS class_section,
      COALESCE(cur_fee.status, 'unbilled') AS current_month_fee_status,
      cur_fee.amount AS current_month_fee_amount,
      cur_fee.paid_amount AS current_month_fee_paid,
      COALESCE(att.attendance_percentage, 0) AS attendance_percentage
    FROM students s
    JOIN classes c ON s.class_id = c.id
    LEFT JOIN fees cur_fee 
      ON cur_fee.student_id = s.id 
      AND cur_fee.month = MONTH(CURRENT_DATE()) 
      AND cur_fee.year = YEAR(CURRENT_DATE())
    LEFT JOIN (
      SELECT 
        student_id,
        ROUND((SUM(CASE WHEN status IN ('present', 'late') THEN 1 ELSE 0 END) / COUNT(*)) * 100, 1) AS attendance_percentage
      FROM attendance
      WHERE MONTH(date) = MONTH(CURRENT_DATE()) AND YEAR(date) = YEAR(CURRENT_DATE())
      GROUP BY student_id
    ) att ON att.student_id = s.id
    WHERE ${whereSql}
    ORDER BY ${sortCol} ${sortOrder}
    LIMIT :limit OFFSET :offset
  `;

  params.limit = limit;
  params.offset = offset;

  const students = await query(sql, params);

  return { students, total };
}

// ============================================================================
// 2. GET STUDENT BY ID
// ============================================================================
export async function getStudentById(academyId, studentId, user = null) {
  // If teacher, ensure student belongs to an assigned class
  if (user && user.role === "teacher") {
    const assignedClassIds = await getTeacherAssignedClassIds(academyId, user.id);
    if (assignedClassIds.length === 0) {
      throw ApiError.notFound("Student record not found or not assigned to your classes.");
    }
    const check = await query(
      `SELECT id FROM students WHERE id = :studentId AND academy_id = :academyId AND class_id IN (${assignedClassIds.join(
        ","
      )}) AND deleted_at IS NULL LIMIT 1`,
      { studentId, academyId }
    );
    if (!check || check.length === 0) {
      throw ApiError.notFound("Student record not found or not assigned to your classes.");
    }
  }

  // 1. Core student details + Class info
  const studentRows = await query(
    `SELECT 
       s.*,
       c.name AS class_name,
       c.section AS class_section,
       c.timing_start,
       c.timing_end,
       c.monthly_fee AS default_class_fee,
       t.name AS class_teacher_name
     FROM students s
     JOIN classes c ON s.class_id = c.id
     LEFT JOIN teachers t ON c.teacher_id = t.id
     WHERE s.id = :studentId AND s.academy_id = :academyId AND s.deleted_at IS NULL LIMIT 1`,
    { studentId, academyId }
  );

  if (!studentRows || studentRows.length === 0) {
    throw ApiError.notFound("Student record not found.");
  }

  const student = studentRows[0];

  // 2. Attendance summary for current month
  const attendanceRows = await query(
    `SELECT 
       COUNT(*) AS total_marked_days,
       SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) AS present_days,
       SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) AS absent_days,
       SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) AS late_days,
       SUM(CASE WHEN status = 'leave' THEN 1 ELSE 0 END) AS leave_days,
       ROUND((SUM(CASE WHEN status IN ('present', 'late') THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0)) * 100, 1) AS attendance_percentage
     FROM attendance
     WHERE student_id = :studentId 
       AND MONTH(date) = MONTH(CURRENT_DATE()) 
       AND YEAR(date) = YEAR(CURRENT_DATE())`,
    { studentId }
  );
  const attendanceSummary = attendanceRows[0] || {
    total_marked_days: 0,
    present_days: 0,
    absent_days: 0,
    late_days: 0,
    leave_days: 0,
    attendance_percentage: 0,
  };

  // 3. Last 6 fee records
  const feeRecords = await query(
    `SELECT 
       id, month, year, amount, paid_amount, due_date, status, late_fee, created_at
     FROM fees
     WHERE student_id = :studentId AND academy_id = :academyId
     ORDER BY year DESC, month DESC
     LIMIT 6`,
    { studentId, academyId }
  );

  // 4. Latest exam results
  const examResults = await query(
    `SELECT 
       e.name AS exam_name,
       e.session_label,
       sub.name AS subject_name,
       m.marks_obtained,
       es.total_marks,
       es.passing_marks,
       ROUND((m.marks_obtained / es.total_marks) * 100, 1) AS percentage
     FROM marks m
     JOIN exam_subjects es ON m.exam_subject_id = es.id
     JOIN exams e ON es.exam_id = e.id
     JOIN subjects sub ON es.subject_id = sub.id
     WHERE m.student_id = :studentId AND m.academy_id = :academyId
     ORDER BY e.start_date DESC, sub.name ASC
     LIMIT 10`,
    { studentId, academyId }
  );

  const formattedExamResults = examResults.map((r) => ({
    ...r,
    grade: calculateGrade(r.percentage || 0),
    isPassed: r.marks_obtained >= r.passing_marks,
  }));

  // 5. Parent Account Details
  const parentRows = await query(
    `SELECT u.id AS parent_user_id, u.name, u.phone, u.email
     FROM parent_students ps
     JOIN users u ON ps.parent_user_id = u.id
     WHERE ps.student_id = :studentId AND u.deleted_at IS NULL LIMIT 1`,
    { studentId }
  );

  return {
    ...student,
    attendanceSummary,
    feeRecords,
    examResults: formattedExamResults,
    parent: parentRows[0] || null,
  };
}

// ============================================================================
// 3. CREATE STUDENT (Transaction, Capacity Check, Auto Roll No, Parent Account)
// ============================================================================
export async function createStudent(academyId, data, currentUserId = null) {
  return await withTransaction(async (conn) => {
    // 1. Verify Class and Check Capacity
    const [classRows] = await conn.query(
      `SELECT id, name, capacity, monthly_fee 
       FROM classes 
       WHERE id = :classId AND academy_id = :academyId AND deleted_at IS NULL LIMIT 1`,
      { classId: data.classId, academyId }
    );

    if (!classRows || classRows.length === 0) {
      throw ApiError.badRequest("Selected class does not exist or has been deleted.");
    }

    const cls = classRows[0];

    // Count active students currently enrolled
    const [countRows] = await conn.query(
      `SELECT COUNT(*) AS active_count 
       FROM students 
       WHERE class_id = :classId AND academy_id = :academyId AND status = 'active' AND deleted_at IS NULL`,
      { classId: data.classId, academyId }
    );
    const activeCount = countRows[0]?.active_count || 0;

    if (activeCount >= cls.capacity) {
      throw ApiError.badRequest(
        `Class '${cls.name}' has reached its maximum capacity of ${cls.capacity} students.`
      );
    }

    // 2. Determine Monthly Fee (use provided or default from class)
    const monthlyFee =
      data.monthlyFee !== undefined && data.monthlyFee !== null
        ? data.monthlyFee
        : cls.monthly_fee;

    // 3. Determine or Auto-Generate Roll Number
    let rollNo = data.rollNo ? data.rollNo.trim() : "";
    if (!rollNo) {
      const [maxRows] = await conn.query(
        `SELECT MAX(CAST(roll_no AS UNSIGNED)) AS max_roll 
         FROM students 
         WHERE academy_id = :academyId AND roll_no REGEXP '^[0-9]+$'`,
        { academyId }
      );
      const maxRoll = maxRows[0]?.max_roll;
      rollNo = maxRoll ? String(maxRoll + 1) : "1001";
    } else {
      // Check roll number uniqueness
      const [existingRoll] = await conn.query(
        `SELECT id FROM students WHERE academy_id = :academyId AND roll_no = :rollNo AND deleted_at IS NULL LIMIT 1`,
        { academyId, rollNo }
      );
      if (existingRoll && existingRoll.length > 0) {
        throw ApiError.conflict(`Roll number '${rollNo}' is already assigned in this academy.`);
      }
    }

    // 4. Normalize Parent Phone
    const parentPhone = normalizePakistaniPhone(data.parentPhone);

    // 5. Insert Student Record
    const [studentResult] = await conn.query(
      `INSERT INTO students (
         academy_id, class_id, roll_no, name, father_name, gender,
         date_of_birth, phone, parent_phone, address, monthly_fee, discount,
         admission_date, status
       ) VALUES (
         :academyId, :classId, :rollNo, :name, :fatherName, :gender,
         :dateOfBirth, :phone, :parentPhone, :address, :monthlyFee, :discount,
         :admissionDate, :status
       )`,
      {
        academyId,
        classId: data.classId,
        rollNo,
        name: data.name,
        fatherName: data.fatherName,
        gender: data.gender || "male",
        dateOfBirth: data.dateOfBirth || null,
        phone: data.phone ? normalizePakistaniPhone(data.phone) : null,
        parentPhone,
        address: data.address || null,
        monthlyFee,
        discount: data.discount || 0,
        admissionDate: data.admissionDate || new Date().toISOString().slice(0, 10),
        status: data.status || "active",
      }
    );
    const studentId = studentResult.insertId;

    // 6. Automatically create or link Parent User Account
    let parentUserId = null;
    const [existingParents] = await conn.query(
      `SELECT id FROM users 
       WHERE academy_id = :academyId AND phone = :parentPhone AND role = 'parent' AND deleted_at IS NULL LIMIT 1`,
      { academyId, parentPhone }
    );

    if (existingParents && existingParents.length > 0) {
      parentUserId = existingParents[0].id;
    } else {
      // Create new parent user with temporary password
      const tempPassword = "Parent@1234";
      const passwordHash = await bcrypt.hash(tempPassword, 12);
      const parentEmail = `parent.${parentPhone}.${Date.now()}@academy${academyId}.local`;

      const [parentUserResult] = await conn.query(
        `INSERT INTO users (
           academy_id, name, email, phone, password_hash, role, is_active
         ) VALUES (
           :academyId, :name, :email, :phone, :passwordHash, 'parent', TRUE
         )`,
        {
          academyId,
          name: `${data.fatherName} (Parent)`,
          email: parentEmail,
          phone: parentPhone,
          passwordHash,
        }
      );
      parentUserId = parentUserResult.insertId;
    }

    // Link parent and student
    await conn.query(
      `INSERT INTO parent_students (parent_user_id, student_id)
       VALUES (:parentUserId, :studentId)
       ON DUPLICATE KEY UPDATE student_id = student_id`,
      { parentUserId, studentId }
    );

    // 7. Audit Log
    await conn.query(
      `INSERT INTO activity_logs (academy_id, user_id, action, entity, entity_id, meta)
       VALUES (:academyId, :userId, 'STUDENT_CREATED', 'students', :studentId, :meta)`,
      {
        academyId,
        userId: currentUserId,
        studentId,
        meta: JSON.stringify({
          name: data.name,
          rollNo,
          classId: data.classId,
          className: cls.name,
          parentPhone,
        }),
      }
    );

    return {
      id: studentId,
      academyId,
      classId: data.classId,
      className: cls.name,
      rollNo,
      name: data.name,
      fatherName: data.fatherName,
      parentPhone,
      monthlyFee,
      status: data.status || "active",
      parentUserId,
    };
  });

  clearDashboardCache(academyId);
  return result;
}

// ============================================================================
// 4. UPDATE STUDENT
// ============================================================================
export async function updateStudent(academyId, studentId, data, currentUserId = null) {
  await withTransaction(async (conn) => {
    // 1. Verify student exists
    const [existing] = await conn.query(
      `SELECT * FROM students WHERE id = :studentId AND academy_id = :academyId AND deleted_at IS NULL LIMIT 1`,
      { studentId, academyId }
    );
    if (!existing || existing.length === 0) {
      throw ApiError.notFound("Student record not found.");
    }
    const currentStudent = existing[0];

    // 2. If class is being changed, check target class existence & capacity
    if (data.classId && data.classId !== currentStudent.class_id) {
      const [classRows] = await conn.query(
        `SELECT id, name, capacity FROM classes WHERE id = :classId AND academy_id = :academyId AND deleted_at IS NULL LIMIT 1`,
        { classId: data.classId, academyId }
      );
      if (!classRows || classRows.length === 0) {
        throw ApiError.badRequest("Selected target class does not exist.");
      }
      const targetClass = classRows[0];

      const [countRows] = await conn.query(
        `SELECT COUNT(*) AS active_count FROM students WHERE class_id = :classId AND academy_id = :academyId AND status = 'active' AND deleted_at IS NULL`,
        { classId: data.classId, academyId }
      );
      if ((countRows[0]?.active_count || 0) >= targetClass.capacity) {
        throw ApiError.badRequest(
          `Target class '${targetClass.name}' has reached its maximum capacity of ${targetClass.capacity} students.`
        );
      }
    }

    // 3. If roll number changed, verify uniqueness
    if (data.rollNo && data.rollNo !== currentStudent.roll_no) {
      const [duplicate] = await conn.query(
        `SELECT id FROM students WHERE academy_id = :academyId AND roll_no = :rollNo AND id != :studentId AND deleted_at IS NULL LIMIT 1`,
        { academyId, rollNo: data.rollNo, studentId }
      );
      if (duplicate && duplicate.length > 0) {
        throw ApiError.conflict(`Roll number '${data.rollNo}' is already taken.`);
      }
    }

    // 4. Build dynamic UPDATE fields
    const fields = [];
    const params = { studentId, academyId };

    const fieldMap = {
      name: "name",
      fatherName: "father_name",
      classId: "class_id",
      rollNo: "roll_no",
      gender: "gender",
      dateOfBirth: "date_of_birth",
      phone: "phone",
      parentPhone: "parent_phone",
      address: "address",
      monthlyFee: "monthly_fee",
      discount: "discount",
      admissionDate: "admission_date",
      status: "status",
    };

    for (const [key, dbCol] of Object.entries(fieldMap)) {
      if (data[key] !== undefined) {
        fields.push(`${dbCol} = :${key}`);
        params[key] = data[key];
      }
    }

    if (fields.length > 0) {
      await conn.query(
        `UPDATE students SET ${fields.join(", ")} WHERE id = :studentId AND academy_id = :academyId`,
        params
      );
    }

    // 5. Audit Log
    await conn.query(
      `INSERT INTO activity_logs (academy_id, user_id, action, entity, entity_id, meta)
       VALUES (:academyId, :userId, 'STUDENT_UPDATED', 'students', :studentId, :meta)`,
      {
        academyId,
        userId: currentUserId,
        studentId,
        meta: JSON.stringify(data),
      }
    );
  });

  clearDashboardCache(academyId);
  return await getStudentById(academyId, studentId);
}

// ============================================================================
// 5. DELETE STUDENT (Soft delete)
// ============================================================================
export async function deleteStudent(academyId, studentId, currentUserId = null) {
  const existing = await query(
    `SELECT id, name, roll_no FROM students WHERE id = :studentId AND academy_id = :academyId AND deleted_at IS NULL LIMIT 1`,
    { studentId, academyId }
  );

  if (!existing || existing.length === 0) {
    throw ApiError.notFound("Student record not found.");
  }

  // Soft delete: keep attendance and fees history intact
  await query(
    `UPDATE students SET deleted_at = NOW(), status = 'left' WHERE id = :studentId AND academy_id = :academyId`,
    { studentId, academyId }
  );

  await query(
    `INSERT INTO activity_logs (academy_id, user_id, action, entity, entity_id, meta)
     VALUES (:academyId, :userId, 'STUDENT_DELETED', 'students', :studentId, :meta)`,
    {
      academyId,
      userId: currentUserId,
      studentId,
      meta: JSON.stringify({
        name: existing[0].name,
        rollNo: existing[0].roll_no,
      }),
    }
  );

  clearDashboardCache(academyId);

  return { message: "Student record soft-deleted successfully." };
}

// ============================================================================
// 6. BULK IMPORT STUDENTS (CSV)
// ============================================================================
export async function bulkImportStudents(academyId, csvBuffer, currentUserId = null) {
  const csvContent = csvBuffer.toString("utf8");
  const lines = csvContent.split(/\r?\n/).filter((line) => line.trim().length > 0);

  if (lines.length < 2) {
    throw ApiError.badRequest("CSV file must contain a header row and at least one student data row.");
  }

  // Parse header line
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/[\"\'\s_]/g, ""));

  const nameIdx = headers.findIndex((h) => h.includes("name") && !h.includes("father"));
  const fatherIdx = headers.findIndex((h) => h.includes("father"));
  const classIdx = headers.findIndex((h) => h.includes("class"));
  const parentPhoneIdx = headers.findIndex((h) => h.includes("parent") || h.includes("guardian") || h.includes("emergency"));
  const phoneIdx = headers.findIndex((h) => h === "phone" || h === "studentphone");
  const rollIdx = headers.findIndex((h) => h.includes("roll"));
  const feeIdx = headers.findIndex((h) => h.includes("fee"));
  const genderIdx = headers.findIndex((h) => h.includes("gender"));

  if (nameIdx === -1 || fatherIdx === -1 || classIdx === -1) {
    throw ApiError.badRequest(
      "CSV header must include at least 'Name', 'Father Name', and 'Class' columns."
    );
  }

  // Load classes for lookup
  const classList = await query(
    `SELECT id, name, capacity, monthly_fee FROM classes WHERE academy_id = :academyId AND deleted_at IS NULL`,
    { academyId }
  );

  const report = {
    inserted: 0,
    skipped: 0,
    errors: [],
  };

  await withTransaction(async (conn) => {
    for (let i = 1; i < lines.length; i++) {
      const rowNumber = i + 1;
      const rawCols = lines[i].split(",").map((c) => c.trim().replace(/^["']|["']$/g, ""));

      const name = rawCols[nameIdx];
      const fatherName = rawCols[fatherIdx];
      const rawClass = rawCols[classIdx];
      const rawParentPhone = parentPhoneIdx !== -1 ? rawCols[parentPhoneIdx] : "";
      const rawPhone = phoneIdx !== -1 ? rawCols[phoneIdx] : "";
      const rawRoll = rollIdx !== -1 ? rawCols[rollIdx] : "";
      const rawFee = feeIdx !== -1 ? parseInt(rawCols[feeIdx], 10) : undefined;
      const rawGender = genderIdx !== -1 ? rawCols[genderIdx]?.toLowerCase() : "male";

      if (!name || !fatherName || !rawClass) {
        report.skipped++;
        report.errors.push({ row: rowNumber, message: "Missing required Name, Father Name, or Class" });
        continue;
      }

      // Match class by ID or Name (exact or normalized)
      const normRaw = rawClass.toLowerCase().replace(/th|st|nd|rd/g, "").trim();
      let matchedClass = classList.find(
        (c) =>
          String(c.id) === rawClass ||
          c.name.toLowerCase() === rawClass.toLowerCase() ||
          c.name.toLowerCase().replace(/th|st|nd|rd/g, "").trim() === normRaw ||
          c.name.toLowerCase().includes(normRaw) ||
          rawClass.toLowerCase().includes(c.name.toLowerCase())
      );

      if (!matchedClass) {
        report.skipped++;
        report.errors.push({ row: rowNumber, message: `Class '${rawClass}' not found in academy.` });
        continue;
      }

      const parentPhone = rawParentPhone ? normalizePakistaniPhone(rawParentPhone) : "03000000000";

      // Roll Number
      let rollNo = rawRoll;
      if (!rollNo) {
        const [maxRows] = await conn.query(
          `SELECT MAX(CAST(roll_no AS UNSIGNED)) AS max_roll FROM students WHERE academy_id = :academyId AND roll_no REGEXP '^[0-9]+$'`,
          { academyId }
        );
        const maxRoll = maxRows[0]?.max_roll;
        rollNo = maxRoll ? String(maxRoll + 1) : "1001";
      }

      const monthlyFee = !isNaN(rawFee) && rawFee > 0 ? rawFee : matchedClass.monthly_fee;

      try {
        const [insertRes] = await conn.query(
          `INSERT INTO students (
             academy_id, class_id, roll_no, name, father_name, gender, parent_phone, phone, monthly_fee, admission_date, status
           ) VALUES (
             :academyId, :classId, :rollNo, :name, :fatherName, :gender, :parentPhone, :phone, :monthlyFee, CURDATE(), 'active'
           )`,
          {
            academyId,
            classId: matchedClass.id,
            rollNo,
            name,
            fatherName,
            gender: ["male", "female", "other"].includes(rawGender) ? rawGender : "male",
            parentPhone,
            phone: rawPhone ? normalizePakistaniPhone(rawPhone) : null,
            monthlyFee,
          }
        );

        report.inserted++;
      } catch (err) {
        report.skipped++;
        report.errors.push({ row: rowNumber, message: err.message });
      }
    }

    // Log Activity
    await conn.query(
      `INSERT INTO activity_logs (academy_id, user_id, action, entity, meta)
       VALUES (:academyId, :userId, 'STUDENTS_BULK_IMPORTED', 'students', :meta)`,
      {
        academyId,
        userId: currentUserId,
        meta: JSON.stringify({
          inserted: report.inserted,
          skipped: report.skipped,
        }),
      }
    );
  });

  return report;
}

// ============================================================================
// 7. EXPORT STUDENTS (CSV format)
// ============================================================================
export async function exportStudentsCsv(academyId) {
  const students = await query(
    `SELECT 
       s.roll_no,
       s.name,
       s.father_name,
       c.name AS class_name,
       s.gender,
       s.phone,
       s.parent_phone,
       s.monthly_fee,
       s.status,
       s.admission_date
     FROM students s
     JOIN classes c ON s.class_id = c.id
     WHERE s.academy_id = :academyId AND s.deleted_at IS NULL
     ORDER BY c.id ASC, CAST(s.roll_no AS UNSIGNED) ASC`,
    { academyId }
  );

  const header = [
    "Roll No",
    "Student Name",
    "Father Name",
    "Class",
    "Gender",
    "Student Phone",
    "Parent Phone",
    "Monthly Fee",
    "Status",
    "Admission Date",
  ];

  const rows = students.map((s) => [
    `"${s.roll_no}"`,
    `"${s.name}"`,
    `"${s.father_name}"`,
    `"${s.class_name}"`,
    `"${s.gender}"`,
    `"${s.phone || ""}"`,
    `"${s.parent_phone}"`,
    `"${s.monthly_fee}"`,
    `"${s.status}"`,
    `"${s.admission_date}"`,
  ]);

  return [header.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

// ============================================================================
// 8. UPDATE STUDENT PHOTO
// ============================================================================
export async function updateStudentPhoto(academyId, studentId, filename, currentUserId = null) {
  const student = await getStudentById(academyId, studentId);
  const photoUrl = `/uploads/students/${filename}`;

  await query(
    `UPDATE students SET photo_url = :photoUrl WHERE id = :studentId AND academy_id = :academyId`,
    { photoUrl, studentId, academyId }
  );

  await query(
    `INSERT INTO activity_logs (academy_id, user_id, action, entity, entity_id, meta)
     VALUES (:academyId, :userId, 'STUDENT_PHOTO_UPDATED', 'students', :studentId, :meta)`,
    {
      academyId,
      userId: currentUserId,
      studentId,
      meta: JSON.stringify({ photoUrl }),
    }
  );

  return { photoUrl };
}

// ============================================================================
// 9. PROMOTE SINGLE STUDENT & PROMOTE CLASS
// ============================================================================
export async function promoteStudent(academyId, studentId, targetClassId, currentUserId = null) {
  return await withTransaction(async (conn) => {
    const [students] = await conn.query(
      `SELECT id, name, class_id FROM students WHERE id = :studentId AND academy_id = :academyId AND deleted_at IS NULL LIMIT 1`,
      { studentId, academyId }
    );
    if (!students || students.length === 0) {
      throw ApiError.notFound("Student record not found.");
    }

    const [targetClass] = await conn.query(
      `SELECT id, name, capacity FROM classes WHERE id = :targetClassId AND academy_id = :academyId AND deleted_at IS NULL LIMIT 1`,
      { targetClassId, academyId }
    );
    if (!targetClass || targetClass.length === 0) {
      throw ApiError.badRequest("Target class does not exist.");
    }

    // Check capacity
    const [countRows] = await conn.query(
      `SELECT COUNT(*) AS active_count FROM students WHERE class_id = :targetClassId AND academy_id = :academyId AND status = 'active' AND deleted_at IS NULL`,
      { targetClassId, academyId }
    );
    if ((countRows[0]?.active_count || 0) >= targetClass[0].capacity) {
      throw ApiError.badRequest(`Target class '${targetClass[0].name}' has reached its maximum capacity.`);
    }

    await conn.query(
      `UPDATE students SET class_id = :targetClassId WHERE id = :studentId AND academy_id = :academyId`,
      { targetClassId, studentId, academyId }
    );

    await conn.query(
      `INSERT INTO activity_logs (academy_id, user_id, action, entity, entity_id, meta)
       VALUES (:academyId, :userId, 'STUDENT_PROMOTED', 'students', :studentId, :meta)`,
      {
        academyId,
        userId: currentUserId,
        studentId,
        meta: JSON.stringify({
          fromClassId: students[0].class_id,
          toClassId: targetClassId,
          targetClassName: targetClass[0].name,
        }),
      }
    );

    return {
      message: `Student '${students[0].name}' has been successfully promoted to '${targetClass[0].name}'.`,
    };
  });
}

export async function promoteClass(academyId, currentClassId, targetClassId, currentUserId = null) {
  return await withTransaction(async (conn) => {
    const [fromClass] = await conn.query(
      `SELECT id, name FROM classes WHERE id = :currentClassId AND academy_id = :academyId AND deleted_at IS NULL LIMIT 1`,
      { currentClassId, academyId }
    );
    const [toClass] = await conn.query(
      `SELECT id, name, capacity FROM classes WHERE id = :targetClassId AND academy_id = :academyId AND deleted_at IS NULL LIMIT 1`,
      { targetClassId, academyId }
    );

    if (!fromClass || fromClass.length === 0 || !toClass || toClass.length === 0) {
      throw ApiError.badRequest("Source or target class not found.");
    }

    // Count moving students
    const [movingRows] = await conn.query(
      `SELECT COUNT(*) AS moving_count FROM students WHERE class_id = :currentClassId AND academy_id = :academyId AND status = 'active' AND deleted_at IS NULL`,
      { currentClassId, academyId }
    );
    const movingCount = movingRows[0]?.moving_count || 0;

    // Count already in target class
    const [currentInTarget] = await conn.query(
      `SELECT COUNT(*) AS count FROM students WHERE class_id = :targetClassId AND academy_id = :academyId AND status = 'active' AND deleted_at IS NULL`,
      { targetClassId, academyId }
    );
    const targetCount = currentInTarget[0]?.count || 0;

    if (targetCount + movingCount > toClass[0].capacity) {
      throw ApiError.badRequest(
        `Cannot promote: Target class '${toClass[0].name}' capacity (${toClass[0].capacity}) would be exceeded. Currently has ${targetCount}, attempting to move ${movingCount}.`
      );
    }

    await conn.query(
      `UPDATE students SET class_id = :targetClassId WHERE class_id = :currentClassId AND academy_id = :academyId AND deleted_at IS NULL`,
      { targetClassId, currentClassId, academyId }
    );

    await conn.query(
      `INSERT INTO activity_logs (academy_id, user_id, action, entity, meta)
       VALUES (:academyId, :userId, 'CLASS_PROMOTED', 'classes', :meta)`,
      {
        academyId,
        userId: currentUserId,
        meta: JSON.stringify({
          fromClass: fromClass[0].name,
          toClass: toClass[0].name,
          promotedCount: movingCount,
        }),
      }
    );

    return {
      message: `Successfully promoted ${movingCount} students from '${fromClass[0].name}' to '${toClass[0].name}'.`,
      promotedCount: movingCount,
    };
  });
}

export default {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  bulkImportStudents,
  exportStudentsCsv,
  updateStudentPhoto,
  promoteStudent,
  promoteClass,
};
