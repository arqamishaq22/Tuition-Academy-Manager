import { query, withTransaction } from "../config/db.js";

export async function markAttendance(academyId, { classId, date, records }) {
  return await withTransaction(async (conn) => {
    // Upsert attendance records for the date and class
    for (const rec of records) {
      await conn.query(
        `INSERT INTO attendance (academy_id, class_id, student_id, date, status, remarks)
         VALUES (:academyId, :classId, :studentId, :date, :status, :remarks)
         ON DUPLICATE KEY UPDATE status = :status, remarks = :remarks`,
        {
          academyId,
          classId,
          studentId: rec.studentId,
          date,
          status: rec.status,
          remarks: rec.remarks || null,
        }
      );
    }

    return {
      date,
      classId,
      totalMarked: records.length,
      message: "Attendance marked successfully",
    };
  });
}

export async function getClassAttendance(academyId, classId, date) {
  return await query(
    `SELECT a.id, a.student_id, a.status, a.remarks, a.date,
            s.full_name, s.roll_number, s.parent_phone
     FROM attendance a
     JOIN students s ON a.student_id = s.id
     WHERE a.academy_id = :academyId AND a.class_id = :classId AND a.date = :date`,
    { academyId, classId, date }
  );
}

export async function getMonthlySummary(academyId, classId, monthYear) {
  // e.g. monthYear = '2026-11'
  return await query(
    `SELECT date,
            SUM(status = 'Present') AS present_count,
            SUM(status = 'Absent') AS absent_count,
            SUM(status = 'Late') AS late_count,
            SUM(status = 'Leave') AS leave_count
     FROM attendance
     WHERE academy_id = :academyId AND class_id = :classId AND date LIKE :monthPrefix
     GROUP BY date
     ORDER BY date ASC`,
    {
      academyId,
      classId,
      monthPrefix: `${monthYear}%`,
    }
  );
}

export default {
  markAttendance,
  getClassAttendance,
  getMonthlySummary,
};
