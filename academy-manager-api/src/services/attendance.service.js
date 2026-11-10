import { query, withTransaction } from "../config/db.js";
import ApiError from "../utils/ApiError.js";
import { clearDashboardCache } from "../utils/cache.js";
import {
  calculateAttendancePercentage,
  getTodayDateKarachi,
  getCurrentYearMonthKarachi,
  isSunday,
} from "../utils/attendance.js";

/**
 * Verifies class exists in the academy and that the user (if a teacher) is assigned to it.
 */
async function verifyClassAccess(academyId, classId, user) {
  if (user.role === "owner" || user.role === "staff") {
    const cls = await query(
      `SELECT id, name, days_of_week FROM classes WHERE id = :classId AND academy_id = :academyId AND deleted_at IS NULL LIMIT 1`,
      { classId, academyId }
    );
    if (!cls || cls.length === 0) {
      throw ApiError.notFound("Class record not found.");
    }
    return cls[0];
  }

  if (user.role === "teacher") {
    const teachers = await query(
      `SELECT id FROM teachers WHERE user_id = :userId AND academy_id = :academyId AND is_active = TRUE LIMIT 1`,
      { userId: user.id, academyId }
    );
    if (!teachers || teachers.length === 0) {
      throw ApiError.forbidden("Teacher profile not found or inactive.");
    }
    const teacherId = teachers[0].id;

    const cls = await query(
      `SELECT DISTINCT c.id, c.name, c.days_of_week
       FROM classes c
       LEFT JOIN class_subjects cs ON cs.class_id = c.id
       WHERE c.id = :classId 
         AND c.academy_id = :academyId 
         AND c.deleted_at IS NULL
         AND (c.teacher_id = :teacherId OR cs.teacher_id = :teacherId)
       LIMIT 1`,
      { classId, academyId, teacherId }
    );

    if (!cls || cls.length === 0) {
      throw ApiError.notFound("Class record not found or not assigned to you.");
    }
    return cls[0];
  }

  throw ApiError.forbidden("Access denied to attendance resources.");
}

/**
 * Returns class IDs assigned to a teacher.
 */
async function getAssignedClassIdsForTeacher(academyId, userId) {
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

// ============================================================================
// 1. GET CLASS ATTENDANCE FOR A DATE
// ============================================================================
export async function getClassAttendance(academyId, classId, dateStr = null, user) {
  const date = dateStr || getTodayDateKarachi();
  const cls = await verifyClassAccess(academyId, classId, user);

  const students = await query(
    `SELECT 
       s.id AS student_id,
       s.roll_no,
       s.name AS student_name,
       s.father_name,
       s.gender,
       s.photo_url,
       s.admission_date,
       a.id AS attendance_id,
       a.status,
       a.note,
       a.created_at AS marked_at
     FROM students s
     LEFT JOIN attendance a 
       ON a.student_id = s.id 
       AND a.date = :date
     WHERE s.academy_id = :academyId 
       AND s.class_id = :classId 
       AND s.status = 'active'
       AND s.deleted_at IS NULL
       AND s.admission_date <= :date
     ORDER BY CAST(s.roll_no AS UNSIGNED) ASC`,
    { academyId, classId, date }
  );

  let present = 0;
  let absent = 0;
  let late = 0;
  let leave = 0;
  let notMarked = 0;

  for (const s of students) {
    if (s.status === "present") present++;
    else if (s.status === "absent") absent++;
    else if (s.status === "late") late++;
    else if (s.status === "leave") leave++;
    else notMarked++;
  }

  const total = students.length;
  const attendancePercentage = calculateAttendancePercentage(present, late, absent);

  return {
    class: {
      id: cls.id,
      name: cls.name,
    },
    date,
    isSunday: isSunday(date),
    summary: {
      present,
      absent,
      late,
      leave,
      notMarked,
      total,
      attendancePercentage,
    },
    students,
  };
}

// ============================================================================
// 2. MARK BULK ATTENDANCE (Transaction + Upsert + Sunday & Future Check)
// ============================================================================
export async function markAttendance(academyId, { classId, date, records }, user) {
  const todayKarachi = getTodayDateKarachi();

  // 1. Future Date Check
  if (date > todayKarachi) {
    throw ApiError.badRequest("Attendance cannot be marked for future dates.");
  }

  // 2. Verify Class Access
  const cls = await verifyClassAccess(academyId, classId, user);

  // 3. Sunday Check: unless Sunday is scheduled in days_of_week
  if (isSunday(date)) {
    const scheduledDays = cls.days_of_week || "";
    if (!scheduledDays.toLowerCase().includes("sun")) {
      throw ApiError.badRequest(
        `Attendance cannot be marked on Sunday: Sunday is not scheduled for '${cls.name}' (${cls.days_of_week}).`
      );
    }
  }

  // 4. Validate Student IDs & Admission Dates
  const studentIds = records.map((r) => r.studentId);
  const studentRows = await query(
    `SELECT id, name, admission_date 
     FROM students 
     WHERE academy_id = :academyId 
       AND class_id = :classId 
       AND id IN (${studentIds.join(",")}) 
       AND deleted_at IS NULL 
       AND status = 'active'`,
    { academyId, classId }
  );

  if (studentRows.length !== studentIds.length) {
    throw ApiError.badRequest("One or more students do not belong to this class or have been deactivated.");
  }

  // Check that date is not before student admission date
  for (const s of studentRows) {
    if (date < s.admission_date) {
      throw ApiError.badRequest(
        `Cannot mark attendance for student '${s.name}' on ${date}: Student admission date is ${s.admission_date}.`
      );
    }
  }

  // 5. Execute Upsert within Transaction
  await withTransaction(async (conn) => {
    for (const rec of records) {
      await conn.query(
        `INSERT INTO attendance (
           academy_id, class_id, student_id, date, status, note, marked_by
         ) VALUES (
           :academyId, :classId, :studentId, :date, :status, :note, :markedBy
         )
         ON DUPLICATE KEY UPDATE 
           status = VALUES(status), 
           note = VALUES(note), 
           marked_by = VALUES(marked_by),
           updated_at = CURRENT_TIMESTAMP`,
        {
          academyId,
          classId,
          studentId: rec.studentId,
          date,
          status: rec.status,
          note: rec.note || null,
          markedBy: user.id,
        }
      );
    }

    await conn.query(
      `INSERT INTO activity_logs (academy_id, user_id, action, entity, entity_id, meta)
       VALUES (:academyId, :userId, 'ATTENDANCE_MARKED', 'attendance', :classId, :meta)`,
      {
        academyId,
        userId: user.id,
        classId,
        meta: JSON.stringify({
          classId,
          className: cls.name,
          date,
          markedCount: records.length,
        }),
      }
    );
  });

  // 6. Clear dashboard cache and return updated class attendance summary
  clearDashboardCache(academyId);
  return await getClassAttendance(academyId, classId, date, user);
}

// ============================================================================
// 3. EDIT SINGLE ATTENDANCE RECORD (Owner or Staff only)
// ============================================================================
export async function updateAttendanceRecord(academyId, attendanceId, { status, note }, user) {
  const rows = await query(
    `SELECT a.*, s.name AS student_name, c.name AS class_name
     FROM attendance a
     JOIN students s ON a.student_id = s.id
     JOIN classes c ON a.class_id = c.id
     WHERE a.id = :attendanceId AND a.academy_id = :academyId LIMIT 1`,
    { attendanceId, academyId }
  );

  if (!rows || rows.length === 0) {
    throw ApiError.notFound("Attendance record not found.");
  }

  const existing = rows[0];

  await query(
    `UPDATE attendance 
     SET status = :status, note = :note, marked_by = :markedBy, updated_at = CURRENT_TIMESTAMP
     WHERE id = :attendanceId AND academy_id = :academyId`,
    {
      status,
      note: note !== undefined ? note : existing.note,
      markedBy: user.id,
      attendanceId,
      academyId,
    }
  );

  await query(
    `INSERT INTO activity_logs (academy_id, user_id, action, entity, entity_id, meta)
     VALUES (:academyId, :userId, 'ATTENDANCE_UPDATED', 'attendance', :attendanceId, :meta)`,
    {
      academyId,
      userId: user.id,
      attendanceId,
      meta: JSON.stringify({
        studentName: existing.student_name,
        className: existing.class_name,
        date: existing.date,
        oldStatus: existing.status,
        newStatus: status,
      }),
    }
  );

  clearDashboardCache(academyId);

  return {
    id: attendanceId,
    studentId: existing.student_id,
    studentName: existing.student_name,
    classId: existing.class_id,
    className: existing.class_name,
    date: existing.date,
    status,
    note: note !== undefined ? note : existing.note,
    updatedAt: new Date().toISOString(),
  };
}

// ============================================================================
// 4. GET CLASS ATTENDANCE HISTORY (Monthly Heatmap & Percentages)
// ============================================================================
export async function getClassAttendanceHistory(academyId, classId, month = null, year = null, user) {
  const currentYM = getCurrentYearMonthKarachi();
  const selectedMonth = month ? parseInt(month, 10) : currentYM.month;
  const selectedYear = year ? parseInt(year, 10) : currentYM.year;

  const padMonth = String(selectedMonth).padStart(2, "0");
  const lastDay = new Date(Date.UTC(selectedYear, selectedMonth, 0)).getUTCDate();
  const startDate = `${selectedYear}-${padMonth}-01`;
  const endDate = `${selectedYear}-${padMonth}-${String(lastDay).padStart(2, "0")}`;

  await verifyClassAccess(academyId, classId, user);

  const rows = await query(
    `SELECT 
       date,
       COUNT(*) AS total_marked,
       SUM(status = 'present') AS present_count,
       SUM(status = 'absent') AS absent_count,
       SUM(status = 'late') AS late_count,
       SUM(status = 'leave') AS leave_count
     FROM attendance
     WHERE academy_id = :academyId 
       AND class_id = :classId 
       AND date >= :startDate AND date <= :endDate
     GROUP BY date
     ORDER BY date ASC`,
    { academyId, classId, startDate, endDate }
  );

  let totalPctSum = 0;
  let bestDay = null;
  let lowestDay = null;

  const daily = rows.map((r) => {
    const present = Number(r.present_count);
    const late = Number(r.late_count);
    const absent = Number(r.absent_count);
    const leave = Number(r.leave_count);
    const percent = calculateAttendancePercentage(present, late, absent);

    totalPctSum += percent;

    if (!bestDay || percent > bestDay.percent) {
      bestDay = { date: r.date, percent };
    }
    if (!lowestDay || percent < lowestDay.percent) {
      lowestDay = { date: r.date, percent };
    }

    return {
      date: r.date,
      present,
      late,
      absent,
      leave,
      totalMarked: Number(r.total_marked),
      percentage: percent,
    };
  });

  const daysMarked = daily.length;
  const averagePercent =
    daysMarked > 0 ? Math.round((totalPctSum / daysMarked) * 10) / 10 : 0.0;

  return {
    classId,
    month: selectedMonth,
    year: selectedYear,
    summary: {
      daysMarked,
      averagePercent,
      bestDay: bestDay || { date: null, percent: 0 },
      lowestDay: lowestDay || { date: null, percent: 0 },
    },
    daily,
  };
}

// ============================================================================
// 5. GET STUDENT ATTENDANCE (Calendar Data & Individual Totals)
// ============================================================================
export async function getStudentAttendance(academyId, studentId, month = null, year = null, user) {
  const currentYM = getCurrentYearMonthKarachi();
  const selectedMonth = month ? parseInt(month, 10) : currentYM.month;
  const selectedYear = year ? parseInt(year, 10) : currentYM.year;

  const padMonth = String(selectedMonth).padStart(2, "0");
  const lastDay = new Date(Date.UTC(selectedYear, selectedMonth, 0)).getUTCDate();
  const startDate = `${selectedYear}-${padMonth}-01`;
  const endDate = `${selectedYear}-${padMonth}-${String(lastDay).padStart(2, "0")}`;

  // Verify student existence
  const studentRows = await query(
    `SELECT s.id, s.name, s.roll_no, s.class_id, s.admission_date, c.name AS class_name
     FROM students s
     JOIN classes c ON s.class_id = c.id
     WHERE s.id = :studentId AND s.academy_id = :academyId AND s.deleted_at IS NULL LIMIT 1`,
    { studentId, academyId }
  );

  if (!studentRows || studentRows.length === 0) {
    throw ApiError.notFound("Student record not found.");
  }
  const student = studentRows[0];

  // If teacher, check access to student's class
  if (user.role === "teacher") {
    await verifyClassAccess(academyId, student.class_id, user);
  }

  const records = await query(
    `SELECT date, status, note, created_at
     FROM attendance
     WHERE student_id = :studentId 
       AND academy_id = :academyId 
       AND date >= :startDate AND date <= :endDate
       AND date >= :admissionDate
     ORDER BY date ASC`,
    {
      studentId,
      academyId,
      startDate,
      endDate,
      admissionDate: student.admission_date,
    }
  );

  let present = 0;
  let absent = 0;
  let late = 0;
  let leave = 0;

  for (const r of records) {
    if (r.status === "present") present++;
    else if (r.status === "absent") absent++;
    else if (r.status === "late") late++;
    else if (r.status === "leave") leave++;
  }

  const overallPercentage = calculateAttendancePercentage(present, late, absent);

  return {
    student: {
      id: student.id,
      name: student.name,
      rollNo: student.roll_no,
      classId: student.class_id,
      className: student.class_name,
      admissionDate: student.admission_date,
    },
    month: selectedMonth,
    year: selectedYear,
    totals: {
      present,
      absent,
      late,
      leave,
      totalMarked: records.length,
    },
    overallPercentage,
    records,
  };
}

// ============================================================================
// 6. GET MONTHLY CLASS REPORT (Student Ledger with <75% Low Attendance Flag)
// ============================================================================
export async function getMonthlyClassReport(academyId, classId, month = null, year = null, user) {
  const currentYM = getCurrentYearMonthKarachi();
  const selectedMonth = month ? parseInt(month, 10) : currentYM.month;
  const selectedYear = year ? parseInt(year, 10) : currentYM.year;

  const padMonth = String(selectedMonth).padStart(2, "0");
  const lastDay = new Date(Date.UTC(selectedYear, selectedMonth, 0)).getUTCDate();
  const startDate = `${selectedYear}-${padMonth}-01`;
  const endDate = `${selectedYear}-${padMonth}-${String(lastDay).padStart(2, "0")}`;

  const cls = await verifyClassAccess(academyId, classId, user);

  const rows = await query(
    `SELECT 
       s.id AS student_id,
       s.roll_no,
       s.name AS student_name,
       s.father_name,
       s.gender,
       s.parent_phone,
       s.admission_date,
       COALESCE(att.present_count, 0) AS present_count,
       COALESCE(att.absent_count, 0) AS absent_count,
       COALESCE(att.late_count, 0) AS late_count,
       COALESCE(att.leave_count, 0) AS leave_count
     FROM students s
     LEFT JOIN (
       SELECT 
         a.student_id,
         SUM(a.status = 'present') AS present_count,
         SUM(a.status = 'absent') AS absent_count,
         SUM(a.status = 'late') AS late_count,
         SUM(a.status = 'leave') AS leave_count
       FROM attendance a
       WHERE a.academy_id = :academyId 
         AND a.class_id = :classId 
         AND a.date >= :startDate AND a.date <= :endDate
       GROUP BY a.student_id
     ) att ON att.student_id = s.id
     WHERE s.academy_id = :academyId 
       AND s.class_id = :classId 
       AND s.status = 'active'
       AND s.deleted_at IS NULL
       AND s.admission_date <= :endDate
     ORDER BY CAST(s.roll_no AS UNSIGNED) ASC`,
    { academyId, classId, startDate, endDate }
  );

  let totalPctSum = 0;
  let lowAttendanceCount = 0;

  const students = rows.map((r) => {
    const present = Number(r.present_count);
    const absent = Number(r.absent_count);
    const late = Number(r.late_count);
    const leave = Number(r.leave_count);
    const percentage = calculateAttendancePercentage(present, late, absent);

    totalPctSum += percentage;

    // Flag low attendance if marked days exist and percentage is below 75%
    const totalMarkedDays = present + absent + late;
    const lowAttendance = totalMarkedDays > 0 && percentage < 75.0;
    if (lowAttendance) {
      lowAttendanceCount++;
    }

    return {
      studentId: r.student_id,
      rollNo: r.roll_no,
      name: r.student_name,
      fatherName: r.father_name,
      gender: r.gender,
      parentPhone: r.parent_phone,
      present,
      absent,
      late,
      leave,
      attendancePercentage: percentage,
      lowAttendance,
    };
  });

  const totalStudents = students.length;
  const averagePercentage =
    totalStudents > 0 ? Math.round((totalPctSum / totalStudents) * 10) / 10 : 0.0;

  return {
    class: {
      id: cls.id,
      name: cls.name,
    },
    month: selectedMonth,
    year: selectedYear,
    summary: {
      totalStudents,
      averagePercentage,
      lowAttendanceCount,
    },
    students,
  };
}

// ============================================================================
// 7. GET DAILY ABSENTEES (For Parent Notifications)
// ============================================================================
export async function getDailyAbsentees(academyId, dateStr = null, user) {
  const date = dateStr || getTodayDateKarachi();

  let classFilter = "";
  const params = { academyId, date };

  if (user.role === "teacher") {
    const assignedClassIds = await getAssignedClassIdsForTeacher(academyId, user.id);
    if (assignedClassIds.length === 0) {
      return [];
    }
    classFilter = ` AND a.class_id IN (${assignedClassIds.join(",")})`;
  }

  const absentees = await query(
    `SELECT 
       a.id AS attendance_id,
       a.date,
       a.note,
       s.id AS student_id,
       s.roll_no,
       s.name AS student_name,
       s.father_name,
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
       ${classFilter}
     ORDER BY c.name ASC, CAST(s.roll_no AS UNSIGNED) ASC`,
    params
  );

  return absentees;
}

// ============================================================================
// 8. EXPORT MONTHLY REPORT AS CSV
// ============================================================================
export async function exportMonthlyReportCsv(academyId, classId, month = null, year = null, user) {
  const report = await getMonthlyClassReport(academyId, classId, month, year, user);

  const header = [
    "Roll No",
    "Student Name",
    "Father Name",
    "Class",
    "Present",
    "Late",
    "Absent",
    "Leave",
    "Attendance %",
    "Low Attendance Alert",
  ];

  const rows = report.students.map((s) => [
    `"${s.rollNo}"`,
    `"${s.name}"`,
    `"${s.fatherName}"`,
    `"${report.class.name}"`,
    `"${s.present}"`,
    `"${s.late}"`,
    `"${s.absent}"`,
    `"${s.leave}"`,
    `"${s.attendancePercentage}%"`,
    `"${s.lowAttendance ? "YES (<75%)" : "NO"}"`,
  ]);

  return [header.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

export default {
  getClassAttendance,
  markAttendance,
  updateAttendanceRecord,
  getClassAttendanceHistory,
  getStudentAttendance,
  getMonthlyClassReport,
  getDailyAbsentees,
  exportMonthlyReportCsv,
};
