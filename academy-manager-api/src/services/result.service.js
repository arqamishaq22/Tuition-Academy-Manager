import { query, withTransaction } from "../config/db.js";
import ApiError from "../utils/ApiError.js";

export async function getExams(academyId, classId) {
  let sql = `
    SELECT e.*, c.name AS class_name,
           COUNT(m.id) AS marks_entered_count
    FROM exams e
    JOIN classes c ON e.class_id = c.id
    LEFT JOIN exam_marks m ON m.exam_id = e.id
    WHERE e.academy_id = :academyId
  `;
  const params = { academyId };

  if (classId) {
    sql += ` AND e.class_id = :classId`;
    params.classId = classId;
  }

  sql += ` GROUP BY e.id ORDER BY e.date DESC, e.id DESC`;
  return await query(sql, params);
}

export async function createExam(academyId, data) {
  const result = await query(
    `INSERT INTO exams (academy_id, class_id, name, subject, date, total_marks, passing_marks, status)
     VALUES (:academyId, :classId, :name, :subject, :date, :totalMarks, :passingMarks, 'Upcoming')`,
    {
      academyId,
      classId: data.classId,
      name: data.name,
      subject: data.subject,
      date: data.date,
      totalMarks: data.totalMarks,
      passingMarks: data.passingMarks,
    }
  );

  return { id: result.insertId, ...data, status: "Upcoming" };
}

export async function saveMarks(academyId, { examId, marks }) {
  const exam = await query(`SELECT * FROM exams WHERE id = :examId AND academy_id = :academyId LIMIT 1`, {
    examId,
    academyId,
  });

  if (!exam || exam.length === 0) {
    throw ApiError.notFound("Exam not found.");
  }

  return await withTransaction(async (conn) => {
    for (const item of marks) {
      await conn.query(
        `INSERT INTO exam_marks (academy_id, exam_id, student_id, obtained_marks)
         VALUES (:academyId, :examId, :studentId, :obtainedMarks)
         ON DUPLICATE KEY UPDATE obtained_marks = :obtainedMarks`,
        {
          academyId,
          examId,
          studentId: item.studentId,
          obtainedMarks: item.obtainedMarks,
        }
      );
    }

    // Update exam status to 'Published'
    await conn.query(`UPDATE exams SET status = 'Published' WHERE id = :examId`, { examId });

    return {
      examId,
      totalRecords: marks.length,
      message: "Marks recorded and published successfully",
    };
  });
}

export async function getReportCard(academyId, studentId) {
  const student = await query(
    `SELECT s.*, c.name AS class_name, a.name AS academy_name
     FROM students s
     JOIN classes c ON s.class_id = c.id
     JOIN academies a ON s.academy_id = a.id
     WHERE s.id = :studentId AND s.academy_id = :academyId LIMIT 1`,
    { studentId, academyId }
  );

  if (!student || student.length === 0) {
    throw ApiError.notFound("Student not found.");
  }

  const marks = await query(
    `SELECT m.obtained_marks, e.name AS exam_name, e.subject, e.total_marks, e.passing_marks, e.date
     FROM exam_marks m
     JOIN exams e ON m.exam_id = e.id
     WHERE m.student_id = :studentId AND m.academy_id = :academyId
     ORDER BY e.date ASC`,
    { studentId, academyId }
  );

  return {
    student: student[0],
    results: marks,
  };
}

export default {
  getExams,
  createExam,
  saveMarks,
  getReportCard,
};

