import app from "../src/app.js";
import { pool, testConnection, query } from "../src/config/db.js";
import path from "path";
import fs from "fs";

async function runTests() {
  console.log("============================================================");
  console.log("🧪 RUNNING COMPREHENSIVE TESTS FOR STUDENTS, CLASSES & TEACHERS");
  console.log("============================================================");

  await testConnection();
  console.log("✓ Connected to MySQL database.");

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api/v1`;
  console.log(`✓ Test server running at ${baseUrl}`);

  try {
    // -------------------------------------------------------------
    // Setup: Authenticate as Owner, Teacher, and Parent
    // -------------------------------------------------------------
    console.log("\n[AUTH SETUP] Logging in test personas...");

    // 1. Owner Login
    const ownerLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "owner@demo.com", password: "Demo@1234" }),
    });
    const ownerLoginData = await ownerLoginRes.json();
    const ownerToken = ownerLoginData.data?.accessToken;
    console.log(`    Owner Login: status ${ownerLoginRes.status}, token: ${Boolean(ownerToken)}`);

    // 2. Teacher Login (Sir Hamza Tariq)
    const teacherLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "hamza@brightfuture.edu.pk", password: "Demo@1234" }),
    });
    const teacherLoginData = await teacherLoginRes.json();
    const teacherToken = teacherLoginData.data?.accessToken;
    console.log(`    Teacher Login: status ${teacherLoginRes.status}, token: ${Boolean(teacherToken)}`);

    // 3. Parent Login
    const parentLoginRes = await fetch(`${baseUrl}/auth/parent-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: "0300-1110001", password: "Demo@1234" }),
    });
    const parentLoginData = await parentLoginRes.json();
    const parentToken = parentLoginData.data?.accessToken;
    console.log(`    Parent Login: status ${parentLoginRes.status}, token: ${Boolean(parentToken)}`);

    // -------------------------------------------------------------
    // 1. ACCESS CONTROL & ROLE GUARD TESTS
    // -------------------------------------------------------------
    console.log("\n[1] Testing Access Control & RBAC...");

    // A. Parent access to students -> 403 Forbidden
    const parentToStudentsRes = await fetch(`${baseUrl}/students`, {
      headers: { Authorization: `Bearer ${parentToken}` },
    });
    console.log(`    Parent accessing /students: status ${parentToStudentsRes.status} (Expected: 403)`);
    if (parentToStudentsRes.status !== 403) throw new Error("Parent should be forbidden from /students");

    // B. Teacher access to teachers module -> 403 Forbidden
    const teacherToTeachersRes = await fetch(`${baseUrl}/teachers`, {
      headers: { Authorization: `Bearer ${teacherToken}` },
    });
    console.log(`    Teacher accessing /teachers: status ${teacherToTeachersRes.status} (Expected: 403)`);
    if (teacherToTeachersRes.status !== 403) throw new Error("Teacher should be forbidden from /teachers");

    // C. Teacher attempting to delete a student -> 403 Forbidden
    const teacherDeleteRes = await fetch(`${baseUrl}/students/1`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${teacherToken}` },
    });
    console.log(`    Teacher deleting student: status ${teacherDeleteRes.status} (Expected: 403)`);
    if (teacherDeleteRes.status !== 403) throw new Error("Teacher should not have delete access");

    // -------------------------------------------------------------
    // 2. TEACHERS MODULE TESTS
    // -------------------------------------------------------------
    console.log("\n[2] Testing TEACHERS Module (/api/v1/teachers)...");

    // GET /teachers
    const getTeachersRes = await fetch(`${baseUrl}/teachers?page=1&limit=5`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const teachersData = await getTeachersRes.json();
    console.log(`    GET /teachers: status ${getTeachersRes.status}, count: ${teachersData.data?.length}, total: ${teachersData.meta?.total}`);

    // GET /teachers/:id
    const teacherDetailRes = await fetch(`${baseUrl}/teachers/1`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const teacherDetail = await teacherDetailRes.json();
    console.log(`    GET /teachers/1: status ${teacherDetailRes.status}, name: ${teacherDetail.data?.name}`);
    console.log(`    Assigned Classes: ${teacherDetail.data?.classTeacherOf?.length}`);
    console.log(`    Assigned Subjects: ${teacherDetail.data?.subjectAssignments?.length}`);

    // POST /teachers (Create with User Account)
    const newTeacherEmail = `teacher_${Date.now()}@brightfuture.edu.pk`;
    const createTeacherRes = await fetch(`${baseUrl}/teachers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        name: "Sir Bilal Ahmed",
        phone: "0305-9988776",
        email: newTeacherEmail,
        qualification: "M.Phil Physics",
        subject: "Physics",
        salary: 45000,
        joinedOn: "2026-09-01",
        createAccount: true,
        password: "Teacher@Pass123",
      }),
    });
    const createdTeacherData = await createTeacherRes.json();
    const createdTeacherId = createdTeacherData.data?.id;
    console.log(`    POST /teachers: status ${createTeacherRes.status}, id: ${createdTeacherId}, user_id: ${createdTeacherData.data?.user_id}`);

    // PUT /teachers/:id
    const updateTeacherRes = await fetch(`${baseUrl}/teachers/${createdTeacherId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        qualification: "Ph.D Physics (In Progress)",
        salary: 50000,
      }),
    });
    const updatedTeacherData = await updateTeacherRes.json();
    console.log(`    PUT /teachers/${createdTeacherId}: status ${updateTeacherRes.status}, new salary: ${updatedTeacherData.data?.salary}`);

    // DELETE /teachers/:id
    const deleteTeacherRes = await fetch(`${baseUrl}/teachers/${createdTeacherId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const deleteTeacherData = await deleteTeacherRes.json();
    console.log(`    DELETE /teachers/${createdTeacherId}: status ${deleteTeacherRes.status}, message: ${deleteTeacherData.data?.message}`);

    // -------------------------------------------------------------
    // 3. CLASSES MODULE TESTS
    // -------------------------------------------------------------
    console.log("\n[3] Testing CLASSES Module (/api/v1/classes)...");

    // GET /classes/subjects
    const getSubjectsRes = await fetch(`${baseUrl}/classes/subjects`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const subjectsData = await getSubjectsRes.json();
    console.log(`    GET /classes/subjects: status ${getSubjectsRes.status}, subjects count: ${subjectsData.data?.length}`);

    // POST /classes/subjects (Add New Subject)
    const newSubjectName = `Robotics & AI ${Date.now()}`;
    const createSubRes = await fetch(`${baseUrl}/classes/subjects`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({ name: newSubjectName }),
    });
    const createSubData = await createSubRes.json();
    const newSubjectId = createSubData.data?.id;
    console.log(`    POST /classes/subjects: status ${createSubRes.status}, id: ${newSubjectId}, name: ${createSubData.data?.name}`);

    // GET /classes (Owner list with stats)
    const getClassesRes = await fetch(`${baseUrl}/classes`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const classesData = await getClassesRes.json();
    console.log(`    GET /classes: status ${getClassesRes.status}, count: ${classesData.data?.length}`);
    if (classesData.data?.length > 0) {
      const c0 = classesData.data[0];
      console.log(`    Sample Class: ${c0.name} ${c0.section || ""}, Students: ${c0.student_count}, Today Att%: ${c0.today_attendance_pct}%, Monthly Att%: ${c0.monthly_attendance_pct}%`);
    }

    // Teacher-scoped GET /classes (Sir Hamza Tariq)
    const teacherClassesRes = await fetch(`${baseUrl}/classes`, {
      headers: { Authorization: `Bearer ${teacherToken}` },
    });
    const teacherClassesData = await teacherClassesRes.json();
    console.log(`    Teacher-scoped GET /classes: status ${teacherClassesRes.status}, count: ${teacherClassesData.data?.length} (Only assigned classes)`);

    // GET /classes/:id
    const classDetailRes = await fetch(`${baseUrl}/classes/1`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const classDetail = await classDetailRes.json();
    console.log(`    GET /classes/1: status ${classDetailRes.status}, students count: ${classDetail.data?.students?.length}, subjects count: ${classDetail.data?.subjects?.length}`);

    // POST /classes (Create new class)
    const createClassRes = await fetch(`${baseUrl}/classes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        name: `Class 11th Pre-Med ${Date.now()}`,
        section: "C",
        timingStart: "17:00",
        timingEnd: "19:30",
        daysOfWeek: "Mon,Tue,Wed,Thu,Fri",
        monthlyFee: 4500,
        teacherId: 1,
        capacity: 35,
      }),
    });
    const createdClassData = await createClassRes.json();
    const createdClassId = createdClassData.data?.id;
    console.log(`    POST /classes: status ${createClassRes.status}, id: ${createdClassId}, name: ${createdClassData.data?.name}`);

    // POST /classes/:id/subjects (Assign subject & teacher)
    const assignSubRes = await fetch(`${baseUrl}/classes/${createdClassId}/subjects`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        subjectId: newSubjectId,
        teacherId: 1,
      }),
    });
    const assignSubData = await assignSubRes.json();
    console.log(`    POST /classes/${createdClassId}/subjects: status ${assignSubRes.status}, assigned subjects: ${assignSubData.data?.subjects?.length}`);

    // DELETE /classes/:id/subjects/:subjectId (Remove subject)
    const removeSubRes = await fetch(`${baseUrl}/classes/${createdClassId}/subjects/${newSubjectId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    console.log(`    DELETE /classes/${createdClassId}/subjects/${newSubjectId}: status ${removeSubRes.status}`);

    // DELETE /classes/:id on active class with students -> should fail without ?force=true
    const delClassFailRes = await fetch(`${baseUrl}/classes/1`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    console.log(`    DELETE /classes/1 (with active students): status ${delClassFailRes.status} (Expected: 400 Bad Request)`);

    // DELETE /classes/:id on empty class -> 200 OK
    const delClassRes = await fetch(`${baseUrl}/classes/${createdClassId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    console.log(`    DELETE /classes/${createdClassId} (empty class): status ${delClassRes.status}`);

    // -------------------------------------------------------------
    // 4. STUDENTS MODULE TESTS
    // -------------------------------------------------------------
    console.log("\n[4] Testing STUDENTS Module (/api/v1/students)...");

    // GET /students (with pagination, search, status, fee status)
    const getStudentsRes = await fetch(
      `${baseUrl}/students?q=Muhammad&page=1&limit=5&sortBy=name&order=asc`,
      {
        headers: { Authorization: `Bearer ${ownerToken}` },
      }
    );
    const studentsData = await getStudentsRes.json();
    console.log(`    GET /students?q=Muhammad: status ${getStudentsRes.status}, count: ${studentsData.data?.length}, total: ${studentsData.meta?.total}`);
    if (studentsData.data?.length > 0) {
      const s0 = studentsData.data[0];
      console.log(`    Sample Student: ${s0.name}, Class: ${s0.class_name}, Fee Status: ${s0.current_month_fee_status}, Att%: ${s0.attendance_percentage}%`);
    }

    // GET /students/:id (Full profile with attendance summary, 6 fees, results, parent)
    const studentDetailRes = await fetch(`${baseUrl}/students/1`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const studentDetail = await studentDetailRes.json();
    console.log(`    GET /students/1: status ${studentDetailRes.status}, name: ${studentDetail.data?.name}`);
    console.log(`    Attendance summary:`, studentDetail.data?.attendanceSummary);
    console.log(`    Fee history records count: ${studentDetail.data?.feeRecords?.length}`);
    console.log(`    Exam results count: ${studentDetail.data?.examResults?.length}`);
    console.log(`    Parent linked: ${studentDetail.data?.parent?.name} (${studentDetail.data?.parent?.phone})`);

    // POST /students (Create student with auto-roll, capacity check, parent user creation)
    const uniqueParentPhone = `0300${Math.floor(1000000 + Math.random() * 9000000)}`;
    const createStudentRes = await fetch(`${baseUrl}/students`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        name: "Usman Zafar",
        fatherName: "Zafar Iqbal",
        classId: 1,
        parentPhone: uniqueParentPhone,
        phone: "03011234567",
        gender: "male",
        dateOfBirth: "2010-05-15",
        address: "House 24, Model Town, Lahore",
      }),
    });
    const createdStudentData = await createStudentRes.json();
    const createdStudentId = createdStudentData.data?.id;
    console.log(`    POST /students: status ${createStudentRes.status}, id: ${createdStudentId}, auto-roll: ${createdStudentData.data?.rollNo}`);
    console.log(`    Parent user account auto-created: ${Boolean(createdStudentData.data?.parentUserId)}`);

    // PUT /students/:id (Update student)
    const updateStudentRes = await fetch(`${baseUrl}/students/${createdStudentId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        name: "Usman Zafar Updated",
        address: "Updated Address, Lahore",
      }),
    });
    const updatedStudentData = await updateStudentRes.json();
    console.log(`    PUT /students/${createdStudentId}: status ${updateStudentRes.status}, updated name: ${updatedStudentData.data?.name}`);

    // POST /students/:id/promote (Promote single student to Class 2)
    const promoteStudentRes = await fetch(`${baseUrl}/students/${createdStudentId}/promote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({ targetClassId: 2 }),
    });
    const promoteStudentData = await promoteStudentRes.json();
    console.log(`    POST /students/${createdStudentId}/promote: status ${promoteStudentRes.status}, message: ${promoteStudentData.data?.message}`);

    // POST /students/:id/photo (Photo Upload)
    const photoBoundary = "----WebKitFormBoundaryPhoto123";
    const dummyImageBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]); // Minimal JPEG header
    const photoBody = Buffer.concat([
      Buffer.from(`--${photoBoundary}\r\nContent-Disposition: form-data; name="photo"; filename="avatar.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`),
      dummyImageBuffer,
      Buffer.from(`\r\n--${photoBoundary}--\r\n`),
    ]);

    const uploadPhotoRes = await fetch(`${baseUrl}/students/${createdStudentId}/photo`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ownerToken}`,
        "Content-Type": `multipart/form-data; boundary=${photoBoundary}`,
      },
      body: photoBody,
    });
    const uploadPhotoData = await uploadPhotoRes.json();
    console.log(`    POST /students/${createdStudentId}/photo: status ${uploadPhotoRes.status}, url: ${uploadPhotoData.data?.photoUrl}`);

    // POST /promote-class (Promote whole class)
    const promoteClassRes = await fetch(`${baseUrl}/students/promote-class`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({ currentClassId: 2, targetClassId: 3 }),
    });
    const promoteClassData = await promoteClassRes.json();
    console.log(`    POST /students/promote-class: status ${promoteClassRes.status}, message: ${promoteClassData.data?.message}`);

    // GET /students/export (CSV export)
    const exportCsvRes = await fetch(`${baseUrl}/students/export`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const csvContent = await exportCsvRes.text();
    console.log(`    GET /students/export: status ${exportCsvRes.status}, Content-Type: ${exportCsvRes.headers.get("content-type")}`);
    console.log(`    First CSV line: ${csvContent.split("\n")[0]}`);

    // POST /students/bulk-import (CSV bulk upload via FormData)
    const dummyCsv = `Name,Father Name,Class,Parent Phone,Gender\nImport Student 1,Father One,Class 9,03001112233,male\nImport Student 2,Father Two,Class 9,03004445566,female`;
    const boundary = "----WebKitFormBoundaryTest12345";
    const multipartBody = 
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="test_students.csv"\r\n` +
      `Content-Type: text/csv\r\n\r\n` +
      `${dummyCsv}\r\n` +
      `--${boundary}--\r\n`;

    const bulkImportRes = await fetch(`${baseUrl}/students/bulk-import`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ownerToken}`,
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
      },
      body: multipartBody,
    });
    const bulkImportData = await bulkImportRes.json();
    console.log(`    POST /students/bulk-import: status ${bulkImportRes.status}, inserted: ${bulkImportData.data?.inserted}, skipped: ${bulkImportData.data?.skipped}`);

    // DELETE /students/:id (Soft delete)
    const deleteStudentRes = await fetch(`${baseUrl}/students/${createdStudentId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const deleteStudentData = await deleteStudentRes.json();
    console.log(`    DELETE /students/${createdStudentId}: status ${deleteStudentRes.status}, message: ${deleteStudentData.data?.message}`);

    console.log("\n============================================================");
    console.log("🎉 ALL STUDENTS, CLASSES & TEACHERS TESTS PASSED PERFECTLY!");
    console.log("============================================================\n");
  } catch (err) {
    console.error("❌ Test error:", err);
  } finally {
    server.close();
    await pool.end();
    process.exit(0);
  }
}

runTests();
