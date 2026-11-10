import { query, withTransaction } from "../config/db.js";
import ApiError from "../utils/ApiError.js";
import {
  calculateGrade,
  isSubjectPassed,
  calculatePercentage,
  applyDenseRanking,
} from "../utils/grade.js";
import { calculateAttendancePercentage } from "../utils/attendance.js";

/**
 * Returns class IDs assigned to a teacher.
 */
async function getAssignedClassIdsForTeacher(academyId, userId) {
  const teachers = await query(
    `SELECT id FROM teachers WHERE user_id = :userId AND academy_id = :academyId AND is_active = TRUE LIMIT 1`,
    { userId, academyId }
  );
  if (!teachers || teachers.length === 0) return [];
  const teacherId = teachers[0].id;

  const rows = await query(
    `SELECT DISTINCT c.id
     FROM classes c
     LEFT JOIN class_subjects cs ON cs.class_id = c.id
     WHERE c.academy_id = :academyId AND c.deleted_at IS NULL
       AND (c.teacher_id = :teacherId OR cs.teacher_id = :teacherId)`,
    { academyId, teacherId }
  );
  return rows.map((r) => Number(r.id));
}

/**
 * Verifies if a teacher has authorization for an exam's class and subject.
 */
async function verifyTeacherExamAccess(academyId, userId, classId, subjectId = null) {
  const teachers = await query(
    `SELECT id FROM teachers WHERE user_id = :userId AND academy_id = :academyId AND is_active = TRUE LIMIT 1`,
    { userId, academyId }
  );
  if (!teachers || teachers.length === 0) {
    throw ApiError.forbidden("Teacher profile not found or inactive.");
  }
  const teacherId = teachers[0].id;

  if (subjectId) {
    const rows = await query(
      `SELECT 1 FROM classes c
       LEFT JOIN class_subjects cs ON cs.class_id = c.id AND cs.subject_id = :subjectId
       WHERE c.id = :classId AND c.academy_id = :academyId AND c.deleted_at IS NULL
         AND (c.teacher_id = :teacherId OR cs.teacher_id = :teacherId)
       LIMIT 1`,
      { classId, subjectId, teacherId, academyId }
    );
    if (!rows || rows.length === 0) {
      throw ApiError.forbidden("Access denied: You are not assigned to this subject in this class.");
    }
  } else {
    const rows = await query(
      `SELECT 1 FROM classes c
       WHERE c.id = :classId AND c.academy_id = :academyId AND c.deleted_at IS NULL
         AND c.teacher_id = :teacherId
       LIMIT 1`,
      { classId, teacherId, academyId }
    );
    if (!rows || rows.length === 0) {
      throw ApiError.forbidden("Access denied: You are not the assigned teacher for this class.");
    }
  }
}

/**
 * 1. List exams with filters and entry progress metrics.
 */
export async function getExamsList(academyId, user, filters) {
  const { classId, status, session, examType, page = 1, limit = 10 } = filters;
  const offset = (Number(page) - 1) * Number(limit);

  const whereClauses = ["e.academy_id = :academyId"];
  const params = { academyId, limit: Number(limit), offset };

  // Teacher role restriction: Only assigned classes
  if (user.role === "teacher") {
    const assignedClasses = await getAssignedClassIdsForTeacher(academyId, user.id);
    if (assignedClasses.length === 0) {
      return { exams: [], total: 0 };
    }
    whereClauses.push(`e.class_id IN (${assignedClasses.join(",")})`);
  }

  // Parent role restriction: Only published exams
  if (user.role === "parent") {
    whereClauses.push("e.status = 'published'");
  }

  if (classId) {
    whereClauses.push("e.class_id = :classId");
    params.classId = Number(classId);
  }

  if (status && status !== "all") {
    whereClauses.push("e.status = :status");
    params.status = status;
  }

  if (session) {
    whereClauses.push("e.session_label = :session");
    params.session = session;
  }

  if (examType) {
    whereClauses.push("e.exam_type = :examType");
    params.examType = examType;
  }

  const whereSql = whereClauses.join(" AND ");

  // Count query
  const countRes = await query(`SELECT COUNT(*) AS total FROM exams e WHERE ${whereSql}`, params);
  const total = countRes[0]?.total || 0;

  // Data query with subqueries for progress tracking
  const dataSql = `
    SELECT 
      e.id,
      e.academy_id,
      e.class_id,
      c.name AS class_name,
      c.section AS class_section,
      e.name,
      e.exam_type,
      e.start_date,
      e.session_label,
      e.status,
      e.created_at,
      e.updated_at,
      (SELECT COUNT(*) FROM exam_subjects es WHERE es.exam_id = e.id) AS subjects_count,
      (SELECT COUNT(m.id) FROM marks m JOIN exam_subjects es ON m.exam_subject_id = es.id WHERE es.exam_id = e.id) AS marks_entered_count,
      (SELECT COUNT(s.id) FROM students s WHERE s.class_id = e.class_id AND s.status = 'active' AND s.deleted_at IS NULL) AS active_students_count
    FROM exams e
    JOIN classes c ON e.class_id = c.id
    WHERE ${whereSql}
    ORDER BY e.start_date DESC, e.id DESC
    LIMIT :limit OFFSET :offset
  `;

  const rows = await query(dataSql, params);

  const exams = rows.map((r) => {
    const subjectsCount = Number(r.subjects_count) || 0;
    const activeStudents = Number(r.active_students_count) || 0;
    const expected = subjectsCount * activeStudents;
    const entered = Number(r.marks_entered_count) || 0;
    const pct = expected > 0 ? Math.round((entered / expected) * 100) : 0;

    return {
      id: r.id,
      academyId: r.academy_id,
      classId: r.class_id,
      className: r.class_name,
      classSection: r.class_section,
      name: r.name,
      examType: r.exam_type,
      startDate: r.start_date,
      sessionLabel: r.session_label,
      status: r.status,
      subjectsCount,
      activeStudentsCount: activeStudents,
      marksProgress: {
        entered,
        expected,
        percentage: pct,
      },
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  });

  return { exams, total };
}

/**
 * 2. Create an examination and allocate subjects with marks in one transaction.
 */
export async function createExam(academyId, user, data) {
  const { classId, name, examType = "monthly", startDate, sessionLabel = "2026-27", subjects } = data;

  // 1. Verify class belongs to academy
  const classes = await query(
    `SELECT id, name FROM classes WHERE id = :classId AND academy_id = :academyId AND deleted_at IS NULL LIMIT 1`,
    { classId, academyId }
  );
  if (!classes || classes.length === 0) {
    throw ApiError.notFound("Class record not found.");
  }

  // Teacher authorization check
  if (user.role === "teacher") {
    await verifyTeacherExamAccess(academyId, user.id, classId);
  }

  // 2. Verify all subjects belong to academy
  const subjectIds = subjects.map((s) => s.subjectId);
  const foundSubjects = await query(
    `SELECT id, name FROM subjects WHERE id IN (${subjectIds.join(",")}) AND academy_id = :academyId`,
    { academyId }
  );
  if (foundSubjects.length !== subjectIds.length) {
    throw ApiError.badRequest("One or more specified subjects do not exist in this academy.");
  }
  const subjectNameMap = new Map(foundSubjects.map((s) => [s.id, s.name]));

  // 3. Atomically create exam and subject associations
  return await withTransaction(async (conn) => {
    const [examResult] = await conn.query(
      `INSERT INTO exams (academy_id, class_id, name, exam_type, start_date, session_label, status)
       VALUES (:academyId, :classId, :name, :examType, :startDate, :sessionLabel, 'upcoming')`,
      { academyId, classId, name, examType, startDate, sessionLabel }
    );

    const examId = examResult.insertId;
    const createdSubjects = [];

    for (const sub of subjects) {
      const [subRes] = await conn.query(
        `INSERT INTO exam_subjects (exam_id, subject_id, total_marks, passing_marks)
         VALUES (:examId, :subjectId, :totalMarks, :passingMarks)`,
        {
          examId,
          subjectId: sub.subjectId,
          totalMarks: sub.totalMarks,
          passingMarks: sub.passingMarks,
        }
      );

      createdSubjects.push({
        id: subRes.insertId,
        subjectId: sub.subjectId,
        subjectName: subjectNameMap.get(sub.subjectId),
        totalMarks: sub.totalMarks,
        passingMarks: sub.passingMarks,
      });
    }

    return {
      id: examId,
      academyId,
      classId,
      className: classes[0].name,
      name,
      examType,
      startDate,
      sessionLabel,
      status: "upcoming",
      subjects: createdSubjects,
    };
  });
}

/**
 * 3. Get exam details with subjects and class result summary.
 */
export async function getExamDetails(academyId, user, examId) {
  // 1. Fetch exam
  const exams = await query(
    `SELECT e.*, c.name AS class_name, c.section AS class_section
     FROM exams e
     JOIN classes c ON e.class_id = c.id
     WHERE e.id = :examId AND e.academy_id = :academyId
     LIMIT 1`,
    { examId, academyId }
  );
  if (!exams || exams.length === 0) {
    throw ApiError.notFound("Examination record not found.");
  }
  const exam = exams[0];

  // Teacher check
  if (user.role === "teacher") {
    await verifyTeacherExamAccess(academyId, user.id, exam.class_id);
  }

  // 2. Fetch exam subjects
  const subjects = await query(
    `SELECT es.id AS exam_subject_id, es.subject_id, es.total_marks, es.passing_marks, sub.name AS subject_name
     FROM exam_subjects es
     JOIN subjects sub ON es.subject_id = sub.id
     WHERE es.exam_id = :examId
     ORDER BY es.id ASC`,
    { examId }
  );

  // 3. Compute summary across active students
  const activeStudents = await query(
    `SELECT s.id, s.name, s.roll_no
     FROM students s
     WHERE s.class_id = :classId AND s.academy_id = :academyId AND s.status = 'active' AND s.deleted_at IS NULL
     ORDER BY s.roll_no ASC`,
    { classId: exam.class_id, academyId }
  );

  const marksRows = await query(
    `SELECT m.exam_subject_id, m.student_id, m.marks_obtained, m.is_absent
     FROM marks m
     JOIN exam_subjects es ON m.exam_subject_id = es.id
     WHERE es.exam_id = :examId AND m.academy_id = :academyId`,
    { examId, academyId }
  );

  // Index marks by `${examSubjectId}_${studentId}`
  const marksMap = new Map();
  for (const m of marksRows) {
    marksMap.set(`${m.exam_subject_id}_${m.student_id}`, m);
  }

  const examTotalMarks = subjects.reduce((sum, s) => sum + Number(s.total_marks), 0);
  const studentResults = [];

  const gradeDistribution = {
    "A+": 0,
    A: 0,
    B: 0,
    C: 0,
    D: 0,
    F: 0,
  };

  let totalPercentages = 0;
  let passedCount = 0;
  let failedCount = 0;
  let studentsWithMarksCount = 0;

  for (const student of activeStudents) {
    let studentObtained = 0;
    let hasFailedSubject = false;
    let studentHasAnyMark = false;

    for (const sub of subjects) {
      const markEntry = marksMap.get(`${sub.exam_subject_id}_${student.id}`);
      if (markEntry) {
        studentHasAnyMark = true;
        const obtained = markEntry.is_absent ? 0 : Number(markEntry.marks_obtained) || 0;
        studentObtained += obtained;

        if (!isSubjectPassed(markEntry.marks_obtained, sub.passing_marks, markEntry.is_absent)) {
          hasFailedSubject = true;
        }
      } else {
        hasFailedSubject = true;
      }
    }

    if (studentHasAnyMark && examTotalMarks > 0) {
      studentsWithMarksCount++;
      const pct = calculatePercentage(studentObtained, examTotalMarks);
      const grade = calculateGrade(pct);
      gradeDistribution[grade] = (gradeDistribution[grade] || 0) + 1;
      totalPercentages += pct;

      if (!hasFailedSubject && pct >= 50) {
        passedCount++;
      } else {
        failedCount++;
      }

      studentResults.push({
        studentId: student.id,
        studentName: student.name,
        rollNo: student.roll_no,
        totalMarks: examTotalMarks,
        totalObtained: studentObtained,
        percentage: pct,
        grade,
        isPassed: !hasFailedSubject && pct >= 50,
      });
    }
  }

  // Apply dense ranking to determine top 3 students
  applyDenseRanking(studentResults);

  const topStudents = studentResults.slice(0, 3).map((s) => ({
    position: s.position,
    studentId: s.studentId,
    studentName: s.studentName,
    rollNo: s.rollNo,
    totalMarks: s.totalMarks,
    obtainedMarks: s.totalObtained,
    percentage: s.percentage,
    grade: s.grade,
  }));

  const avg = studentsWithMarksCount > 0 ? Math.round((totalPercentages / studentsWithMarksCount) * 10) / 10 : 0;
  const highest = studentResults.length > 0 ? Math.max(...studentResults.map((s) => s.percentage)) : 0;
  const lowest = studentResults.length > 0 ? Math.min(...studentResults.map((s) => s.percentage)) : 0;
  const passPct = studentsWithMarksCount > 0 ? Math.round((passedCount / studentsWithMarksCount) * 1000) / 10 : 0;

  return {
    exam: {
      id: exam.id,
      academyId: exam.academy_id,
      classId: exam.class_id,
      className: exam.class_name,
      classSection: exam.class_section,
      name: exam.name,
      examType: exam.exam_type,
      startDate: exam.start_date,
      sessionLabel: exam.session_label,
      status: exam.status,
      createdAt: exam.created_at,
    },
    subjects: subjects.map((s) => ({
      examSubjectId: s.exam_subject_id,
      subjectId: s.subject_id,
      subjectName: s.subject_name,
      totalMarks: s.total_marks,
      passingMarks: s.passing_marks,
    })),
    summary: {
      totalStudentsInClass: activeStudents.length,
      evaluatedStudents: studentsWithMarksCount,
      average: avg,
      highest,
      lowest,
      passedCount,
      failedCount,
      passPercentage: passPct,
      gradeDistribution,
      topStudents,
    },
  };
}

/**
 * 4a. Update exam header.
 */
export async function updateExam(academyId, user, examId, data) {
  const exams = await query(
    `SELECT * FROM exams WHERE id = :examId AND academy_id = :academyId LIMIT 1`,
    { examId, academyId }
  );
  if (!exams || exams.length === 0) {
    throw ApiError.notFound("Exam record not found.");
  }
  const exam = exams[0];

  if (user.role === "teacher") {
    await verifyTeacherExamAccess(academyId, user.id, exam.class_id);
  }

  if (exam.status === "published") {
    throw ApiError.badRequest("Cannot edit a published exam. Unpublish it first.");
  }

  const newName = data.name || exam.name;
  const newType = data.examType || exam.exam_type;
  const newDate = data.startDate || exam.start_date;
  const newSession = data.sessionLabel || exam.session_label;

  await query(
    `UPDATE exams 
     SET name = :newName, exam_type = :newType, start_date = :newDate, session_label = :newSession
     WHERE id = :examId AND academy_id = :academyId`,
    { newName, newType, newDate, newSession, examId, academyId }
  );

  return {
    id: examId,
    name: newName,
    examType: newType,
    startDate: newDate,
    sessionLabel: newSession,
    status: exam.status,
  };
}

/**
 * 4b. Delete exam. Blocked if marks exist unless owner passes ?force=true.
 */
export async function deleteExam(academyId, user, examId, force = false) {
  const exams = await query(
    `SELECT * FROM exams WHERE id = :examId AND academy_id = :academyId LIMIT 1`,
    { examId, academyId }
  );
  if (!exams || exams.length === 0) {
    throw ApiError.notFound("Exam record not found.");
  }
  const exam = exams[0];

  if (user.role === "teacher") {
    await verifyTeacherExamAccess(academyId, user.id, exam.class_id);
  }

  // Check if marks exist
  const countRes = await query(
    `SELECT COUNT(m.id) AS marks_count
     FROM marks m
     JOIN exam_subjects es ON m.exam_subject_id = es.id
     WHERE es.exam_id = :examId AND m.academy_id = :academyId`,
    { examId, academyId }
  );
  const marksCount = countRes[0]?.marks_count || 0;

  if (marksCount > 0) {
    if (!force) {
      throw ApiError.badRequest(
        "Cannot delete exam with existing student marks. To delete anyway, owner must pass ?force=true."
      );
    }
    if (user.role !== "owner") {
      throw ApiError.forbidden("Only the academy owner can force-delete an exam with recorded marks.");
    }
  }

  await query(`DELETE FROM exams WHERE id = :examId AND academy_id = :academyId`, { examId, academyId });

  return { message: "Exam and associated subjects deleted successfully." };
}

/**
 * 5. Get marks of all students for a specific subject in an exam.
 */
export async function getExamSubjectMarks(academyId, user, examId, subjectId) {
  const exams = await query(
    `SELECT e.*, c.name AS class_name FROM exams e JOIN classes c ON e.class_id = c.id WHERE e.id = :examId AND e.academy_id = :academyId LIMIT 1`,
    { examId, academyId }
  );
  if (!exams || exams.length === 0) {
    throw ApiError.notFound("Exam record not found.");
  }
  const exam = exams[0];

  // Resolve subject by exam_subjects.id or subjects.id
  const examSubjects = await query(
    `SELECT es.id AS exam_subject_id, es.subject_id, es.total_marks, es.passing_marks, s.name AS subject_name
     FROM exam_subjects es
     JOIN subjects s ON es.subject_id = s.id
     WHERE es.exam_id = :examId AND (es.id = :subjectId OR es.subject_id = :subjectId)
     LIMIT 1`,
    { examId, subjectId }
  );
  if (!examSubjects || examSubjects.length === 0) {
    throw ApiError.notFound("Subject not assigned to this exam.");
  }
  const es = examSubjects[0];

  if (user.role === "teacher") {
    await verifyTeacherExamAccess(academyId, user.id, exam.class_id, es.subject_id);
  }

  // Active students in class
  const students = await query(
    `SELECT s.id, s.name, s.roll_no, s.father_name
     FROM students s
     WHERE s.class_id = :classId AND s.academy_id = :academyId AND s.status = 'active' AND s.deleted_at IS NULL
     ORDER BY s.roll_no ASC`,
    { classId: exam.class_id, academyId }
  );

  // Existing marks
  const markRows = await query(
    `SELECT student_id, marks_obtained, is_absent
     FROM marks
     WHERE exam_subject_id = :examSubjectId AND academy_id = :academyId`,
    { examSubjectId: es.exam_subject_id, academyId }
  );
  const markMap = new Map(markRows.map((m) => [m.student_id, m]));

  let entered = 0;
  const studentList = students.map((s) => {
    const m = markMap.get(s.id);
    const isEntered = Boolean(m);
    if (isEntered) entered++;

    const marksObtained = m ? (m.is_absent ? null : Number(m.marks_obtained)) : null;
    const isAbsent = m ? Boolean(m.is_absent) : false;
    const isPassed = m ? isSubjectPassed(m.marks_obtained, es.passing_marks, isAbsent) : false;

    return {
      studentId: s.id,
      studentName: s.name,
      rollNo: s.roll_no,
      fatherName: s.father_name,
      marksObtained,
      isAbsent,
      isPassed,
      isEntered,
    };
  });

  return {
    exam: {
      id: exam.id,
      name: exam.name,
      classId: exam.class_id,
      className: exam.class_name,
      status: exam.status,
    },
    subject: {
      examSubjectId: es.exam_subject_id,
      subjectId: es.subject_id,
      subjectName: es.subject_name,
      totalMarks: es.total_marks,
      passingMarks: es.passing_marks,
    },
    progress: {
      entered,
      total: students.length,
      percentage: students.length > 0 ? Math.round((entered / students.length) * 100) : 0,
    },
    students: studentList,
  };
}

/**
 * 6. Bulk save student marks for an exam subject in a transaction.
 */
export async function saveExamMarks(academyId, user, examId, { subjectId, records }) {
  // 1. Fetch exam
  const exams = await query(
    `SELECT * FROM exams WHERE id = :examId AND academy_id = :academyId LIMIT 1`,
    { examId, academyId }
  );
  if (!exams || exams.length === 0) {
    throw ApiError.notFound("Exam record not found.");
  }
  const exam = exams[0];

  // Publishing lock rule: Cannot edit published exam
  if (exam.status === "published") {
    throw ApiError.badRequest("Marks cannot be edited after publishing unless the exam is unpublished first.");
  }

  // 2. Fetch exam subject
  const examSubjects = await query(
    `SELECT es.id AS exam_subject_id, es.subject_id, es.total_marks, es.passing_marks
     FROM exam_subjects es
     WHERE es.exam_id = :examId AND (es.id = :subjectId OR es.subject_id = :subjectId)
     LIMIT 1`,
    { examId, subjectId }
  );
  if (!examSubjects || examSubjects.length === 0) {
    throw ApiError.notFound("Subject not assigned to this exam.");
  }
  const es = examSubjects[0];

  if (user.role === "teacher") {
    await verifyTeacherExamAccess(academyId, user.id, exam.class_id, es.subject_id);
  }

  // 3. Validate student membership and marks upper bound
  const studentIds = records.map((r) => r.studentId);
  const validStudents = await query(
    `SELECT id FROM students 
     WHERE id IN (${studentIds.join(",")}) AND class_id = :classId AND academy_id = :academyId AND deleted_at IS NULL`,
    { classId: exam.class_id, academyId }
  );
  if (validStudents.length !== studentIds.length) {
    throw ApiError.badRequest("One or more students do not belong to the class assigned to this exam.");
  }

  for (const r of records) {
    if (!r.isAbsent) {
      if (r.marksObtained > es.total_marks) {
        throw ApiError.badRequest(
          `Marks obtained (${r.marksObtained}) cannot exceed total marks (${es.total_marks}) for student ID ${r.studentId}.`
        );
      }
      if (r.marksObtained < 0) {
        throw ApiError.badRequest("Marks obtained cannot be negative.");
      }
    }
  }

  // 4. Batch upsert marks inside transaction
  await withTransaction(async (conn) => {
    for (const r of records) {
      const marksVal = r.isAbsent ? null : r.marksObtained;
      const isAbsentVal = Boolean(r.isAbsent);

      await conn.query(
        `INSERT INTO marks (academy_id, exam_subject_id, student_id, marks_obtained, is_absent)
         VALUES (:academyId, :examSubjectId, :studentId, :marksObtained, :isAbsent)
         ON DUPLICATE KEY UPDATE
           marks_obtained = VALUES(marks_obtained),
           is_absent = VALUES(is_absent)`,
        {
          academyId,
          examSubjectId: es.exam_subject_id,
          studentId: r.studentId,
          marksObtained: marksVal,
          isAbsent: isAbsentVal,
        }
      );
    }

    // Transition exam status to marks_pending if upcoming
    if (exam.status === "upcoming") {
      await conn.query(`UPDATE exams SET status = 'marks_pending' WHERE id = :examId`, { examId });
    }
  });

  return {
    savedCount: records.length,
    message: "Marks saved successfully.",
  };
}

/**
 * 7a. Publish exam. Only allowed if all marks for all active students and subjects are entered.
 */
export async function publishExam(academyId, user, examId) {
  const exams = await query(
    `SELECT * FROM exams WHERE id = :examId AND academy_id = :academyId LIMIT 1`,
    { examId, academyId }
  );
  if (!exams || exams.length === 0) {
    throw ApiError.notFound("Exam record not found.");
  }
  const exam = exams[0];

  if (user.role === "teacher") {
    await verifyTeacherExamAccess(academyId, user.id, exam.class_id);
  }

  // 1. Fetch active students in class
  const activeStudents = await query(
    `SELECT id, name, roll_no 
     FROM students 
     WHERE class_id = :classId AND academy_id = :academyId AND status = 'active' AND deleted_at IS NULL`,
    { classId: exam.class_id, academyId }
  );
  if (activeStudents.length === 0) {
    throw ApiError.badRequest("Cannot publish exam: no active students found in this class.");
  }

  // 2. Fetch exam subjects
  const examSubjects = await query(
    `SELECT es.id AS exam_subject_id, es.subject_id, s.name AS subject_name
     FROM exam_subjects es
     JOIN subjects s ON es.subject_id = s.id
     WHERE es.exam_id = :examId`,
    { examId }
  );
  if (examSubjects.length === 0) {
    throw ApiError.badRequest("Cannot publish exam: no subjects are assigned to this exam.");
  }

  // 3. Fetch all entered marks
  const markRows = await query(
    `SELECT m.exam_subject_id, m.student_id
     FROM marks m
     JOIN exam_subjects es ON m.exam_subject_id = es.id
     WHERE es.exam_id = :examId AND m.academy_id = :academyId`,
    { examId, academyId }
  );

  const enteredSet = new Set(markRows.map((m) => `${m.exam_subject_id}_${m.student_id}`));

  // Check for any missing entries
  const missing = [];
  for (const es of examSubjects) {
    const missingStudents = [];
    for (const st of activeStudents) {
      if (!enteredSet.has(`${es.exam_subject_id}_${st.id}`)) {
        missingStudents.push({
          studentId: st.id,
          studentName: st.name,
          rollNo: st.roll_no,
        });
      }
    }
    if (missingStudents.length > 0) {
      missing.push({
        subjectId: es.subject_id,
        subjectName: es.subject_name,
        missingCount: missingStudents.length,
        missingStudents,
      });
    }
  }

  if (missing.length > 0) {
    throw ApiError.badRequest(
      "Cannot publish exam: Some student marks are missing. All subjects must be marked before publishing.",
      missing
    );
  }

  // 4. Update status to published
  await query(`UPDATE exams SET status = 'published' WHERE id = :examId AND academy_id = :academyId`, {
    examId,
    academyId,
  });

  return {
    message: "Exam published successfully. Results and report cards are now accessible.",
    examId,
    status: "published",
  };
}

/**
 * 7b. Unpublish exam (Owner only).
 */
export async function unpublishExam(academyId, user, examId) {
  const exams = await query(
    `SELECT * FROM exams WHERE id = :examId AND academy_id = :academyId LIMIT 1`,
    { examId, academyId }
  );
  if (!exams || exams.length === 0) {
    throw ApiError.notFound("Exam record not found.");
  }

  await query(
    `UPDATE exams SET status = 'marks_pending' WHERE id = :examId AND academy_id = :academyId`,
    { examId, academyId }
  );

  return {
    message: "Exam unpublished successfully. Marks can now be edited.",
    examId,
    status: "marks_pending",
  };
}

/**
 * 8. Full class result sheet with dense ranking, pass/fail status, and summary metrics.
 */
export async function getExamResults(academyId, user, examId) {
  const exams = await query(
    `SELECT e.*, c.name AS class_name, c.section AS class_section
     FROM exams e
     JOIN classes c ON e.class_id = c.id
     WHERE e.id = :examId AND e.academy_id = :academyId
     LIMIT 1`,
    { examId, academyId }
  );
  if (!exams || exams.length === 0) {
    throw ApiError.notFound("Exam record not found.");
  }
  const exam = exams[0];

  if (user.role === "teacher") {
    await verifyTeacherExamAccess(academyId, user.id, exam.class_id);
  }

  if (user.role === "parent" && exam.status !== "published") {
    throw ApiError.forbidden("Results for this exam have not been published yet.");
  }

  // Subjects
  const subjects = await query(
    `SELECT es.id AS exam_subject_id, es.subject_id, es.total_marks, es.passing_marks, s.name AS subject_name
     FROM exam_subjects es
     JOIN subjects s ON es.subject_id = s.id
     WHERE es.exam_id = :examId
     ORDER BY es.id ASC`,
    { examId }
  );

  // Active students
  const activeStudents = await query(
    `SELECT s.id, s.name, s.roll_no, s.father_name
     FROM students s
     WHERE s.class_id = :classId AND s.academy_id = :academyId AND s.status = 'active' AND s.deleted_at IS NULL
     ORDER BY s.roll_no ASC`,
    { classId: exam.class_id, academyId }
  );

  // Marks
  const markRows = await query(
    `SELECT m.exam_subject_id, m.student_id, m.marks_obtained, m.is_absent
     FROM marks m
     JOIN exam_subjects es ON m.exam_subject_id = es.id
     WHERE es.exam_id = :examId AND m.academy_id = :academyId`,
    { examId, academyId }
  );
  const markMap = new Map(markRows.map((m) => [`${m.exam_subject_id}_${m.student_id}`, m]));

  const examTotalMarks = subjects.reduce((sum, s) => sum + Number(s.total_marks), 0);
  const studentRows = [];

  let totalPercentages = 0;
  let passedCount = 0;
  let failedCount = 0;
  const gradeDistribution = { "A+": 0, A: 0, B: 0, C: 0, D: 0, F: 0 };

  for (const st of activeStudents) {
    let studentObtained = 0;
    let failedSubjectsCount = 0;
    const subjectBreakdown = [];

    for (const sub of subjects) {
      const m = markMap.get(`${sub.exam_subject_id}_${st.id}`);
      const isAbsent = m ? Boolean(m.is_absent) : false;
      const marksObtained = m && !isAbsent && m.marks_obtained !== null ? Number(m.marks_obtained) : null;
      const scoreForTotal = marksObtained !== null ? marksObtained : 0;
      studentObtained += scoreForTotal;

      const passed = m ? isSubjectPassed(m.marks_obtained, sub.passing_marks, isAbsent) : false;
      if (!passed) {
        failedSubjectsCount++;
      }

      const subPct = marksObtained !== null ? calculatePercentage(marksObtained, sub.total_marks) : 0;

      subjectBreakdown.push({
        examSubjectId: sub.exam_subject_id,
        subjectId: sub.subject_id,
        subjectName: sub.subject_name,
        totalMarks: sub.total_marks,
        passingMarks: sub.passing_marks,
        marksObtained,
        isAbsent,
        percentage: subPct,
        grade: calculateGrade(subPct),
        isPassed: passed,
      });
    }

    const overallPct = calculatePercentage(studentObtained, examTotalMarks);
    const overallGrade = calculateGrade(overallPct);
    const overallPassed = failedSubjectsCount === 0 && overallPct >= 50;

    totalPercentages += overallPct;
    gradeDistribution[overallGrade] = (gradeDistribution[overallGrade] || 0) + 1;
    if (overallPassed) {
      passedCount++;
    } else {
      failedCount++;
    }

    studentRows.push({
      studentId: st.id,
      studentName: st.name,
      rollNo: st.roll_no,
      fatherName: st.father_name,
      totalMarks: examTotalMarks,
      totalObtained: studentObtained,
      percentage: overallPct,
      grade: overallGrade,
      status: overallPassed ? "pass" : "fail",
      failedSubjectsCount,
      subjects: subjectBreakdown,
    });
  }

  // Dense ranking
  applyDenseRanking(studentRows);

  const classAvg = studentRows.length > 0 ? Math.round((totalPercentages / studentRows.length) * 10) / 10 : 0;
  const highest = studentRows.length > 0 ? Math.max(...studentRows.map((s) => s.percentage)) : 0;
  const lowest = studentRows.length > 0 ? Math.min(...studentRows.map((s) => s.percentage)) : 0;
  const passPct = studentRows.length > 0 ? Math.round((passedCount / studentRows.length) * 1000) / 10 : 0;

  return {
    exam: {
      id: exam.id,
      name: exam.name,
      examType: exam.exam_type,
      startDate: exam.start_date,
      sessionLabel: exam.session_label,
      status: exam.status,
      classId: exam.class_id,
      className: exam.class_name,
      classSection: exam.class_section,
    },
    subjects: subjects.map((s) => ({
      examSubjectId: s.exam_subject_id,
      subjectId: s.subject_id,
      subjectName: s.subject_name,
      totalMarks: s.total_marks,
      passingMarks: s.passing_marks,
    })),
    summary: {
      totalStudents: studentRows.length,
      passedCount,
      failedCount,
      passPercentage: passPct,
      classAverage: classAvg,
      highest,
      lowest,
      gradeDistribution,
    },
    results: studentRows,
  };
}

/**
 * 9. Comprehensive student report card payload with attendance, remarks, and historical progress.
 */
export async function getReportCard(academyId, user, examId, studentId) {
  // 1. Fetch exam
  const exams = await query(
    `SELECT e.*, c.name AS class_name, c.section AS class_section
     FROM exams e
     JOIN classes c ON e.class_id = c.id
     WHERE e.id = :examId AND e.academy_id = :academyId
     LIMIT 1`,
    { examId, academyId }
  );
  if (!exams || exams.length === 0) {
    throw ApiError.notFound("Exam record not found.");
  }
  const exam = exams[0];

  if (user.role === "teacher") {
    await verifyTeacherExamAccess(academyId, user.id, exam.class_id);
  }

  if (user.role === "parent" && exam.status !== "published") {
    throw ApiError.forbidden("Report card is not yet available for this exam.");
  }

  // 2. Fetch student details
  const students = await query(
    `SELECT s.id, s.name, s.father_name, s.roll_no, s.parent_phone, s.photo_url,
            c.name AS class_name, c.section AS class_section
     FROM students s
     JOIN classes c ON s.class_id = c.id
     WHERE s.id = :studentId AND s.academy_id = :academyId AND s.deleted_at IS NULL
     LIMIT 1`,
    { studentId, academyId }
  );
  if (!students || students.length === 0) {
    throw ApiError.notFound("Student record not found.");
  }
  const student = students[0];

  // 3. Fetch academy info
  const academies = await query(
    `SELECT id, name, address, city, phone, email, logo_url FROM academies WHERE id = :academyId LIMIT 1`,
    { academyId }
  );
  const academy = academies[0] || {};

  // 4. Calculate class ranking and full results
  const fullResults = await getExamResults(academyId, user, examId);
  const studentResult = fullResults.results.find((r) => r.studentId === Number(studentId));

  if (!studentResult) {
    throw ApiError.notFound("No result recorded for this student in the specified exam.");
  }

  // 5. Attendance percentage for the exam's month
  const examDate = new Date(exam.start_date);
  const examMonth = examDate.getMonth() + 1;
  const examYear = examDate.getFullYear();

  const attRows = await query(
    `SELECT status, COUNT(*) AS count
     FROM attendance
     WHERE student_id = :studentId AND academy_id = :academyId
       AND MONTH(date) = :examMonth AND YEAR(date) = :examYear
     GROUP BY status`,
    { studentId, academyId, examMonth, examYear }
  );

  let present = 0, late = 0, absent = 0;
  for (const row of attRows) {
    if (row.status === "present") present = Number(row.count);
    if (row.status === "late") late = Number(row.count);
    if (row.status === "absent") absent = Number(row.count);
  }
  const attendancePercentage = calculateAttendancePercentage(present, late, absent);

  // 6. Progress series: Student's percentage across their last 5 published exams
  const progressRows = await query(
    `SELECT 
       e.id AS exam_id,
       e.name AS exam_name,
       e.exam_type,
       e.start_date,
       SUM(es.total_marks) AS total_marks,
       SUM(COALESCE(m.marks_obtained, 0)) AS obtained_marks
     FROM exams e
     JOIN exam_subjects es ON es.exam_id = e.id
     LEFT JOIN marks m ON m.exam_subject_id = es.id AND m.student_id = :studentId AND m.is_absent = FALSE
     WHERE e.academy_id = :academyId
       AND e.status = 'published'
       AND e.start_date <= :currentExamDate
     GROUP BY e.id, e.name, e.exam_type, e.start_date
     ORDER BY e.start_date ASC
     LIMIT 5`,
    { academyId, studentId, currentExamDate: exam.start_date }
  );

  const progressSeries = progressRows.map((pr) => {
    const total = Number(pr.total_marks) || 0;
    const obtained = Number(pr.obtained_marks) || 0;
    const pct = calculatePercentage(obtained, total);
    return {
      examId: pr.exam_id,
      examName: pr.exam_name,
      examType: pr.exam_type,
      startDate: pr.start_date,
      percentage: pct,
      grade: calculateGrade(pct),
    };
  });

  // 7. Teacher remark
  const remarkRows = await query(
    `SELECT r.remark, r.created_at, u.name AS teacher_name
     FROM report_remarks r
     LEFT JOIN users u ON r.created_by = u.id
     WHERE r.exam_id = :examId AND r.student_id = :studentId AND r.academy_id = :academyId
     LIMIT 1`,
    { examId, studentId, academyId }
  );
  const remark = remarkRows && remarkRows.length > 0 ? remarkRows[0] : null;

  return {
    academy: {
      name: academy.name,
      address: academy.address,
      city: academy.city,
      phone: academy.phone,
      email: academy.email,
      logoUrl: academy.logo_url,
    },
    student: {
      id: student.id,
      name: student.name,
      fatherName: student.father_name,
      rollNo: student.roll_no,
      className: student.class_name,
      section: student.class_section,
      parentPhone: student.parent_phone,
      photoUrl: student.photo_url,
    },
    exam: {
      id: exam.id,
      name: exam.name,
      examType: exam.exam_type,
      startDate: exam.start_date,
      sessionLabel: exam.session_label,
      status: exam.status,
    },
    performance: {
      totalMarks: studentResult.totalMarks,
      obtainedMarks: studentResult.totalObtained,
      percentage: studentResult.percentage,
      grade: studentResult.grade,
      position: studentResult.position,
      status: studentResult.status,
      failedSubjectsCount: studentResult.failedSubjectsCount,
      totalStudentsInClass: fullResults.summary.totalStudents,
    },
    subjects: studentResult.subjects,
    attendance: {
      examPeriod: `${examYear}-${String(examMonth).padStart(2, "0")}`,
      attendancePercentage,
    },
    progressSeries,
    teacherRemark: remark
      ? {
          remark: remark.remark,
          teacherName: remark.teacher_name || "Faculty",
          updatedAt: remark.created_at,
        }
      : null,
  };
}

/**
 * 10. Save teacher remarks on a student's report card.
 */
export async function saveReportRemark(academyId, user, examId, studentId, remark) {
  const exams = await query(
    `SELECT * FROM exams WHERE id = :examId AND academy_id = :academyId LIMIT 1`,
    { examId, academyId }
  );
  if (!exams || exams.length === 0) {
    throw ApiError.notFound("Exam record not found.");
  }
  const exam = exams[0];

  if (user.role === "teacher") {
    await verifyTeacherExamAccess(academyId, user.id, exam.class_id);
  }

  const students = await query(
    `SELECT id FROM students WHERE id = :studentId AND class_id = :classId AND academy_id = :academyId AND deleted_at IS NULL LIMIT 1`,
    { studentId, classId: exam.class_id, academyId }
  );
  if (!students || students.length === 0) {
    throw ApiError.notFound("Student record not found in this class.");
  }

  await query(
    `INSERT INTO report_remarks (academy_id, exam_id, student_id, remark, created_by)
     VALUES (:academyId, :examId, :studentId, :remark, :userId)
     ON DUPLICATE KEY UPDATE
       remark = VALUES(remark),
       created_by = VALUES(created_by)`,
    { academyId, examId, studentId, remark, userId: user.id }
  );

  return {
    examId,
    studentId,
    remark,
    savedBy: user.name || "Teacher",
  };
}

/**
 * 11. Generate CSV export of class result sheet.
 */
export async function exportResultsCsv(academyId, user, examId) {
  const fullResults = await getExamResults(academyId, user, examId);
  const { exam, subjects, results } = fullResults;

  const escapeCsv = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headers = [
    "Roll No",
    "Student Name",
    "Father Name",
    ...subjects.map((s) => `${s.subjectName} (${s.totalMarks})`),
    "Total Marks",
    "Obtained Marks",
    "Percentage",
    "Grade",
    "Position",
    "Result",
  ];

  const rows = [headers.join(",")];

  for (const st of results) {
    const subjectMarks = subjects.map((sub) => {
      const match = st.subjects.find((s) => s.examSubjectId === sub.examSubjectId);
      if (!match) return "N/A";
      if (match.isAbsent) return "Absent";
      return match.marksObtained !== null ? match.marksObtained : "N/A";
    });

    rows.push(
      [
        escapeCsv(st.rollNo),
        escapeCsv(st.studentName),
        escapeCsv(st.fatherName),
        ...subjectMarks,
        st.totalMarks,
        st.totalObtained,
        `${st.percentage}%`,
        escapeCsv(st.grade),
        st.position,
        escapeCsv(st.status.toUpperCase()),
      ].join(",")
    );
  }

  const cleanName = exam.name.replace(/[^a-zA-Z0-9_-]/g, "_");
  const filename = `result-sheet-${cleanName}.csv`;

  return {
    csv: rows.join("\r\n"),
    filename,
  };
}

/**
 * 12. List all published exam results of a single student.
 */
export async function getStudentPublishedResults(academyId, user, studentId) {
  const students = await query(
    `SELECT id, name, roll_no, class_id FROM students WHERE id = :studentId AND academy_id = :academyId AND deleted_at IS NULL LIMIT 1`,
    { studentId, academyId }
  );
  if (!students || students.length === 0) {
    throw ApiError.notFound("Student record not found.");
  }
  const student = students[0];

  if (user.role === "teacher") {
    await verifyTeacherExamAccess(academyId, user.id, student.class_id);
  }

  // Published exams for this class
  const exams = await query(
    `SELECT id, name, exam_type, start_date, session_label
     FROM exams
     WHERE class_id = :classId AND academy_id = :academyId AND status = 'published'
     ORDER BY start_date DESC`,
    { classId: student.class_id, academyId }
  );

  const results = [];
  for (const ex of exams) {
    const examRes = await getExamResults(academyId, user, ex.id);
    const myResult = examRes.results.find((r) => r.studentId === Number(studentId));
    if (myResult) {
      results.push({
        examId: ex.id,
        examName: ex.name,
        examType: ex.exam_type,
        startDate: ex.start_date,
        sessionLabel: ex.session_label,
        totalMarks: myResult.totalMarks,
        obtainedMarks: myResult.totalObtained,
        percentage: myResult.percentage,
        grade: myResult.grade,
        position: myResult.position,
        status: myResult.status,
        failedSubjectsCount: myResult.failedSubjectsCount,
        subjects: myResult.subjects,
      });
    }
  }

  return {
    student: {
      id: student.id,
      name: student.name,
      rollNo: student.roll_no,
    },
    totalExams: results.length,
    exams: results,
  };
}

export default {
  getExamsList,
  createExam,
  getExamDetails,
  updateExam,
  deleteExam,
  getExamSubjectMarks,
  saveExamMarks,
  publishExam,
  unpublishExam,
  getExamResults,
  getReportCard,
  saveReportRemark,
  exportResultsCsv,
  getStudentPublishedResults,
};
