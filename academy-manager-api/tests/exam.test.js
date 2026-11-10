import app from "../src/app.js";
import { pool, testConnection, query } from "../src/config/db.js";

async function runTests() {
  console.log("============================================================");
  console.log("🧪 RUNNING COMPREHENSIVE TESTS FOR EXAMS & RESULTS MODULE");
  console.log("============================================================");

  await testConnection();
  console.log("✓ Connected to MySQL database.");

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api/v1`;
  console.log(`✓ Test server running at ${baseUrl}`);

  let createdExamId = null;

  try {
    // -------------------------------------------------------------
    // AUTH SETUP: Login personas
    // -------------------------------------------------------------
    console.log("\n[AUTH SETUP] Logging in test personas...");

    // 1. Owner Login
    const ownerRes = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "owner@demo.com", password: "Demo@1234" }),
    });
    const ownerData = await ownerRes.json();
    const ownerToken = ownerData.data?.accessToken;
    console.log(`    Owner Login: status ${ownerRes.status}, token: ${Boolean(ownerToken)}`);

    // 2. Teacher Login (Hamza Tariq - assigned to Class 1 & 2)
    const teacherRes = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "hamza@brightfuture.edu.pk", password: "Demo@1234" }),
    });
    const teacherData = await teacherRes.json();
    const teacherToken = teacherData.data?.accessToken;
    console.log(`    Teacher Login: status ${teacherRes.status}, token: ${Boolean(teacherToken)}`);

    // 3. Parent Login
    const parentRes = await fetch(`${baseUrl}/auth/parent-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: "0300-1110001", password: "Demo@1234" }),
    });
    const parentData = await parentRes.json();
    const parentToken = parentData.data?.accessToken;
    console.log(`    Parent Login: status ${parentRes.status}, token: ${Boolean(parentToken)}`);

    // -------------------------------------------------------------
    // 1. ACCESS CONTROL TESTS
    // -------------------------------------------------------------
    console.log("\n[1] Testing Examination Access Control & Permissions...");

    // Parent attempting to create an exam -> 403 Forbidden
    const parentCreate = await fetch(`${baseUrl}/exams`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${parentToken}`,
      },
      body: JSON.stringify({
        classId: 1,
        name: "Unauthorized Parent Exam",
        startDate: "2026-11-20",
        subjects: [{ subjectId: 1, totalMarks: 100, passingMarks: 40 }],
      }),
    });
    console.log(`    Parent POST /exams: status ${parentCreate.status} (expected 403)`);
    if (parentCreate.status !== 403) {
      throw new Error(`Parent should receive 403 on create exam, got ${parentCreate.status}`);
    }

    // Teacher attempting to create exam for unassigned Class 4 -> 403 Forbidden
    const teacherUnassigned = await fetch(`${baseUrl}/exams`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${teacherToken}`,
      },
      body: JSON.stringify({
        classId: 4, // Class 9 (not assigned to Hamza)
        name: "Unauthorized Teacher Exam",
        startDate: "2026-11-20",
        subjects: [{ subjectId: 1, totalMarks: 100, passingMarks: 40 }],
      }),
    });
    console.log(`    Teacher POST /exams for unassigned class: status ${teacherUnassigned.status} (expected 403)`);
    if (teacherUnassigned.status !== 403) {
      throw new Error(`Teacher should receive 403 on unassigned class, got ${teacherUnassigned.status}`);
    }

    // -------------------------------------------------------------
    // 2. VALIDATION FAILURE: passingMarks > totalMarks
    // -------------------------------------------------------------
    console.log("\n[2] Testing Validation Failure: passingMarks > totalMarks...");

    const invalidPassing = await fetch(`${baseUrl}/exams`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        classId: 1,
        name: "Invalid Passing Marks Exam",
        startDate: "2026-11-20",
        subjects: [{ subjectId: 1, totalMarks: 50, passingMarks: 60 }], // 60 > 50
      }),
    });
    const invalidPassingData = await invalidPassing.json();
    console.log(`    passingMarks > totalMarks status: ${invalidPassing.status} (expected 422), error: '${invalidPassingData.errors?.[0]?.message}'`);
    if (invalidPassing.status !== 422) {
      throw new Error(`Expected 422 on invalid passing marks, got ${invalidPassing.status}`);
    }

    // -------------------------------------------------------------
    // 3. SUCCESSFUL EXAM CREATION (POST /exams)
    // -------------------------------------------------------------
    console.log("\n[3] Testing POST /exams (Valid Exam Creation)...");

    const createRes = await fetch(`${baseUrl}/exams`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        classId: 1, // Class 6 (8 students)
        name: "First Term Evaluation 2026",
        examType: "mid_term",
        startDate: "2026-11-15",
        sessionLabel: "2026-27",
        subjects: [
          { subjectId: 1, totalMarks: 50, passingMarks: 20 }, // Mathematics
          { subjectId: 2, totalMarks: 50, passingMarks: 20 }, // English
        ],
      }),
    });
    const createData = await createRes.json();
    createdExamId = createData.data?.id;
    console.log(`    Created Exam ID: ${createdExamId}, name: '${createData.data?.name}', status: '${createData.data?.status}', subjects count: ${createData.data?.subjects?.length}`);
    if (createRes.status !== 201 || !createdExamId) {
      throw new Error("Failed to create exam");
    }

    const mathSubject = createData.data.subjects.find((s) => s.subjectId === 1);
    const engSubject = createData.data.subjects.find((s) => s.subjectId === 2);

    // -------------------------------------------------------------
    // 4. GET /exams & GET /exams/:id (Progress Tracking)
    // -------------------------------------------------------------
    console.log("\n[4] Testing GET /exams & GET /exams/:id (Progress Tracking)...");

    const listRes = await fetch(`${baseUrl}/exams?classId=1`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const listData = await listRes.json();
    console.log(`    GET /exams: status ${listRes.status}, count: ${listData.data?.length}`);
    const foundExam = listData.data?.find((e) => e.id === createdExamId);
    console.log(`    Exam progress: entered: ${foundExam?.marksProgress?.entered}, expected: ${foundExam?.marksProgress?.expected}, percentage: ${foundExam?.marksProgress?.percentage}%`);
    if (listRes.status !== 200 || foundExam?.marksProgress?.entered !== 0) {
      throw new Error("Initial exam progress should be 0");
    }

    const detailsRes = await fetch(`${baseUrl}/exams/${createdExamId}`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const detailsData = await detailsRes.json();
    console.log(`    GET /exams/:id: status ${detailsRes.status}, totalStudentsInClass: ${detailsData.data?.summary?.totalStudentsInClass}`);
    if (detailsRes.status !== 200 || !detailsData.data?.summary?.totalStudentsInClass) {
      throw new Error("Expected active students in Class 6");
    }

    // -------------------------------------------------------------
    // 5. GET /exams/:id/marks?subjectId= (Student Roster)
    // -------------------------------------------------------------
    console.log("\n[5] Testing GET /exams/:id/marks?subjectId= (Score Sheet Roster)...");

    const rosterRes = await fetch(`${baseUrl}/exams/${createdExamId}/marks?subjectId=1`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const rosterData = await rosterRes.json();
    console.log(`    Roster for Math: status ${rosterRes.status}, students count: ${rosterData.data?.students?.length}, entered: ${rosterData.data?.progress?.entered}`);
    if (rosterRes.status !== 200 || !rosterData.data?.students?.length) {
      throw new Error("Expected students in score sheet roster");
    }

    const testStudents = rosterData.data.students;

    // -------------------------------------------------------------
    // 6. VALIDATION FAILURE: Marks Obtained > Total Marks
    // -------------------------------------------------------------
    console.log("\n[6] Testing Validation Failure: Marks Obtained > Total Marks (55 > 50)...");

    const excessMarksRes = await fetch(`${baseUrl}/exams/${createdExamId}/marks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        subjectId: 1, // Math (totalMarks: 50)
        records: [
          { studentId: testStudents[0].studentId, marksObtained: 55 }, // 55 > 50!
        ],
      }),
    });
    const excessMarksData = await excessMarksRes.json();
    console.log(`    Marks > Total status: ${excessMarksRes.status} (expected 400), msg: '${excessMarksData.message}'`);
    if (excessMarksRes.status !== 400) {
      throw new Error(`Expected 400 on marks exceeding total marks, got ${excessMarksRes.status}`);
    }

    // -------------------------------------------------------------
    // 7. RECORD MARKS FOR SUBJECT 1 (Mathematics)
    // -------------------------------------------------------------
    console.log("\n[7] Testing POST /exams/:id/marks (Saving Subject 1 Marks with Absent Flag)...");

    // Give marks to all 8 students; student 7 will be absent
    const mathRecords = testStudents.map((st, idx) => {
      if (idx === 7) {
        return { studentId: st.studentId, isAbsent: true, marksObtained: null };
      }
      return { studentId: st.studentId, isAbsent: false, marksObtained: 40 + idx }; // 40, 41, 42, 43, 44, 45, 46
    });

    const saveMathRes = await fetch(`${baseUrl}/exams/${createdExamId}/marks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        subjectId: 1,
        records: mathRecords,
      }),
    });
    const saveMathData = await saveMathRes.json();
    console.log(`    Save Math marks: status ${saveMathRes.status}, savedCount: ${saveMathData.data?.savedCount}`);
    if (saveMathRes.status !== 200 || saveMathData.data?.savedCount !== testStudents.length) {
      throw new Error("Failed to save Math marks");
    }

    // -------------------------------------------------------------
    // 8. PUBLISHING FAILURE: Missing Marks for Subject 2
    // -------------------------------------------------------------
    console.log("\n[8] Testing Publishing Failure: Subject 2 (English) has missing marks...");

    const earlyPublishRes = await fetch(`${baseUrl}/exams/${createdExamId}/publish`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ownerToken}`,
      },
    });
    const earlyPublishData = await earlyPublishRes.json();
    console.log(`    Early publish status: ${earlyPublishRes.status} (expected 400), msg: '${earlyPublishData.message}'`);
    console.log(`    Missing subjects count: ${earlyPublishData.errors?.length}, first missing: '${earlyPublishData.errors?.[0]?.subjectName}'`);
    if (earlyPublishRes.status !== 400 || earlyPublishData.errors?.length === 0) {
      throw new Error("Publishing should fail when some subject marks are missing");
    }

    // -------------------------------------------------------------
    // 9. RECORD MARKS FOR SUBJECT 2 & PUBLISH EXAM
    // -------------------------------------------------------------
    console.log("\n[9] Recording Subject 2 Marks and Publishing Exam...");

    const engRecords = testStudents.map((st, idx) => ({
      studentId: st.studentId,
      isAbsent: false,
      marksObtained: 35 + idx, // All pass
    }));

    const saveEngRes = await fetch(`${baseUrl}/exams/${createdExamId}/marks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        subjectId: 2,
        records: engRecords,
      }),
    });
    console.log(`    Save English marks status: ${saveEngRes.status}`);

    // Now publish the exam
    const publishRes = await fetch(`${baseUrl}/exams/${createdExamId}/publish`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ownerToken}`,
      },
    });
    const publishData = await publishRes.json();
    console.log(`    Publish exam status: ${publishRes.status}, status: '${publishData.data?.status}'`);
    if (publishRes.status !== 200 || publishData.data?.status !== "published") {
      throw new Error("Publishing failed after all marks were entered");
    }

    // -------------------------------------------------------------
    // 10. PUBLISHING LOCK & UNPUBLISH CAPABILITY
    // -------------------------------------------------------------
    console.log("\n[10] Testing Publishing Lock (Editing Blocked & Owner Unpublish)...");

    // Editing published marks should be blocked
    const blockedEdit = await fetch(`${baseUrl}/exams/${createdExamId}/marks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        subjectId: 1,
        records: [{ studentId: testStudents[0].studentId, marksObtained: 45 }],
      }),
    });
    console.log(`    Edit published marks: status ${blockedEdit.status} (expected 400)`);
    if (blockedEdit.status !== 400) {
      throw new Error("Modifying marks on a published exam should be blocked");
    }

    // Teacher attempting to unpublish -> 403 Forbidden
    const teacherUnpublish = await fetch(`${baseUrl}/exams/${createdExamId}/unpublish`, {
      method: "POST",
      headers: { Authorization: `Bearer ${teacherToken}` },
    });
    console.log(`    Teacher unpublish: status ${teacherUnpublish.status} (expected 403)`);
    if (teacherUnpublish.status !== 403) {
      throw new Error("Teacher should not be allowed to unpublish exam");
    }

    // Owner unpublishes and re-publishes
    const ownerUnpublish = await fetch(`${baseUrl}/exams/${createdExamId}/unpublish`, {
      method: "POST",
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    console.log(`    Owner unpublish: status ${ownerUnpublish.status}, new status: '${(await ownerUnpublish.json()).data?.status}'`);

    // Re-publish to keep published for remaining result tests
    await fetch(`${baseUrl}/exams/${createdExamId}/publish`, {
      method: "POST",
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    console.log("    ✓ Re-published exam for result sheet and report card tests.");

    // -------------------------------------------------------------
    // 11. GET /exams/:id/results (Dense Ranking & Pass/Fail)
    // -------------------------------------------------------------
    console.log("\n[11] Testing GET /exams/:id/results (Result Sheet & Dense Ranking)...");

    const resultsRes = await fetch(`${baseUrl}/exams/${createdExamId}/results`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const resultsData = await resultsRes.json();
    console.log(`    Result sheet status: ${resultsRes.status}, students evaluated: ${resultsData.data?.results?.length}`);
    console.log(`    Summary: Class Avg: ${resultsData.data?.summary?.classAverage}%, Pass%: ${resultsData.data?.summary?.passPercentage}%, Passed: ${resultsData.data?.summary?.passedCount}, Failed: ${resultsData.data?.summary?.failedCount}`);

    const topRank = resultsData.data?.results?.[0];
    console.log(`    Top Student: Position ${topRank?.position}, Name: '${topRank?.studentName}', Total: ${topRank?.totalObtained}/${topRank?.totalMarks}, %: ${topRank?.percentage}%, Grade: '${topRank?.grade}', Status: '${topRank?.status}'`);
    if (resultsRes.status !== 200 || topRank?.position !== 1) {
      throw new Error("First student should have position 1");
    }

    // Check absent student was marked as 'fail'
    const absentStudent = resultsData.data?.results?.find((s) => s.studentId === testStudents[7].studentId);
    console.log(`    Absent Student (${absentStudent?.studentName}): Status: '${absentStudent?.status}' (expected fail)`);
    if (absentStudent?.status !== "fail") {
      throw new Error("Student with absent subject should fail overall");
    }

    // -------------------------------------------------------------
    // 12. PUT /exams/:id/remarks/:studentId (Teacher Remark)
    // -------------------------------------------------------------
    console.log("\n[12] Testing PUT /exams/:id/remarks/:studentId...");

    const targetStudentId = testStudents[0].studentId;
    const remarkRes = await fetch(`${baseUrl}/exams/${createdExamId}/remarks/${targetStudentId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${teacherToken}`,
      },
      body: JSON.stringify({
        remark: "Consistently outstanding performance throughout the academic session.",
      }),
    });
    const remarkData = await remarkRes.json();
    console.log(`    Save remark: status ${remarkRes.status}, remark: '${remarkData.data?.remark}'`);
    if (remarkRes.status !== 200 || !remarkData.data?.remark) {
      throw new Error("Failed to save teacher remark");
    }

    // -------------------------------------------------------------
    // 13. GET /exams/:id/report-card/:studentId (Printable Report Card)
    // -------------------------------------------------------------
    console.log("\n[13] Testing GET /exams/:id/report-card/:studentId...");

    const reportRes = await fetch(`${baseUrl}/exams/${createdExamId}/report-card/${targetStudentId}`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const reportData = await reportRes.json();
    console.log(`    Report card status: ${reportRes.status}`);
    console.log(`    Student: '${reportData.data?.student?.name}', Class: '${reportData.data?.student?.className}', Position: ${reportData.data?.performance?.position}/${reportData.data?.performance?.totalStudentsInClass}`);
    console.log(`    Attendance %: ${reportData.data?.attendance?.attendancePercentage}%, Teacher Remark: '${reportData.data?.teacherRemark?.remark}'`);
    console.log(`    Progress Series count: ${reportData.data?.progressSeries?.length}`);
    if (reportRes.status !== 200 || !reportData.data?.teacherRemark?.remark) {
      throw new Error("Report card data or teacher remark missing");
    }

    // -------------------------------------------------------------
    // 14. GET /exams/:id/results/export (CSV Download)
    // -------------------------------------------------------------
    console.log("\n[14] Testing GET /exams/:id/results/export (CSV Download)...");

    const exportRes = await fetch(`${baseUrl}/exams/${createdExamId}/results/export`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const csvContent = await exportRes.text();
    const contentType = exportRes.headers.get("content-type");
    console.log(`    CSV Export status: ${exportRes.status}, Content-Type: ${contentType}`);
    console.log(`    CSV Header: '${csvContent.split("\r\n")[0]}'`);
    if (exportRes.status !== 200 || !csvContent.includes("Roll No,Student Name")) {
      throw new Error("Invalid CSV result sheet export");
    }

    // -------------------------------------------------------------
    // 15. GET /exams/student/:studentId/results (Student Performance History)
    // -------------------------------------------------------------
    console.log("\n[15] Testing GET /exams/student/:studentId/results...");

    const studentHistoryRes = await fetch(`${baseUrl}/exams/student/${targetStudentId}/results`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const studentHistoryData = await studentHistoryRes.json();
    console.log(`    Student History status: ${studentHistoryRes.status}, published exams count: ${studentHistoryData.data?.totalExams}`);
    if (studentHistoryRes.status !== 200 || studentHistoryData.data?.totalExams === 0) {
      throw new Error("Student exam history should include published exam");
    }

    // -------------------------------------------------------------
    // 16. DELETE /exams/:id (Safe Deletion & Force Option)
    // -------------------------------------------------------------
    console.log("\n[16] Testing DELETE /exams/:id (Safe Deletion & Force Option)...");

    // Regular delete should fail because marks exist
    const safeDeleteRes = await fetch(`${baseUrl}/exams/${createdExamId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    console.log(`    Delete without force: status ${safeDeleteRes.status} (expected 400)`);
    if (safeDeleteRes.status !== 400) {
      throw new Error("Deleting exam with marks should fail without force=true");
    }

    // Force delete by Owner should succeed
    const forceDeleteRes = await fetch(`${baseUrl}/exams/${createdExamId}?force=true`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    console.log(`    Force delete by Owner: status ${forceDeleteRes.status} (expected 200)`);
    if (forceDeleteRes.status !== 200) {
      throw new Error("Force deleting exam by owner should succeed");
    }
    createdExamId = null; // Cleaned up!

    console.log("\n============================================================");
    console.log("🎉 ALL EXAMS & RESULTS MODULE TESTS PASSED WITH 100% SUCCESS!");
    console.log("============================================================");
  } finally {
    if (createdExamId) {
      await query(`DELETE FROM exams WHERE id = :id`, { id: createdExamId });
    }
    server.close();
    await pool.end();
  }
}

runTests().catch((err) => {
  console.error("❌ Test failed with error:", err);
  process.exit(1);
});

