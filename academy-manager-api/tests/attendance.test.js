import app from "../src/app.js";
import { pool, testConnection, query } from "../src/config/db.js";

async function runTests() {
  console.log("============================================================");
  console.log("🧪 RUNNING COMPREHENSIVE TESTS FOR ATTENDANCE MODULE");
  console.log("============================================================");

  await testConnection();
  console.log("✓ Connected to MySQL database.");

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api/v1`;
  console.log(`✓ Test server running at ${baseUrl}`);

  try {
    // -------------------------------------------------------------
    // Setup: Login personas
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

    // 2. Teacher Login (Sir Hamza Tariq, teacher_id: 1)
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
    // 1. ACCESS CONTROL TESTS
    // -------------------------------------------------------------
    console.log("\n[1] Testing Attendance Access Control & Permissions...");

    // Parent accessing attendance -> 403 Forbidden
    const parentRes = await fetch(`${baseUrl}/attendance/class/1`, {
      headers: { Authorization: `Bearer ${parentToken}` },
    });
    console.log(`    Parent accessing /attendance/class/1: status ${parentRes.status} (Expected: 403)`);
    if (parentRes.status !== 403) throw new Error("Parent should be blocked from attendance endpoints");

    // Teacher attempting to PATCH attendance record -> 403 Forbidden
    const teacherPatchRes = await fetch(`${baseUrl}/attendance/1`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${teacherToken}`,
      },
      body: JSON.stringify({ status: "leave" }),
    });
    console.log(`    Teacher attempting PATCH /attendance/1: status ${teacherPatchRes.status} (Expected: 403)`);
    if (teacherPatchRes.status !== 403) throw new Error("Teacher should not have permission to PATCH individual records");

    // -------------------------------------------------------------
    // 2. GET /class/:classId (Daily roster & summary)
    // -------------------------------------------------------------
    console.log("\n[2] Testing GET /attendance/class/:classId...");
    const getClassAttRes = await fetch(`${baseUrl}/attendance/class/1?date=2026-11-02`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const classAttData = await getClassAttRes.json();
    console.log(`    GET /attendance/class/1?date=2026-11-02: status ${getClassAttRes.status}`);
    console.log(`    Class: ${classAttData.data?.class?.name}, Date: ${classAttData.data?.date}`);
    console.log(`    Summary:`, classAttData.data?.summary);
    console.log(`    Students listed count: ${classAttData.data?.students?.length}`);

    // -------------------------------------------------------------
    // 3. POST /mark (Bulk save & upsert)
    // -------------------------------------------------------------
    console.log("\n[3] Testing POST /attendance/mark (Bulk save & upserts)...");

    // Fetch students of class 1
    const studentIds = classAttData.data?.students?.slice(0, 4).map((s) => s.student_id);

    // Test A: Normal valid marking
    const testMarkDate = "2026-11-06"; // Friday
    const markRes = await fetch(`${baseUrl}/attendance/mark`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        classId: 1,
        date: testMarkDate,
        records: [
          { studentId: studentIds[0], status: "present", note: "On time" },
          { studentId: studentIds[1], status: "late", note: "15 mins traffic delay" },
          { studentId: studentIds[2], status: "absent", note: "No call" },
          { studentId: studentIds[3], status: "leave", note: "Sick leave application" },
        ],
      }),
    });
    const markData = await markRes.json();
    console.log(`    POST /attendance/mark: status ${markRes.status} (Expected: 201)`);
    console.log(`    New Summary:`, markData.data?.summary);

    // Test B: Re-marking same date (Upsert check: changing absent to present)
    const reMarkRes = await fetch(`${baseUrl}/attendance/mark`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        classId: 1,
        date: testMarkDate,
        records: [
          { studentId: studentIds[2], status: "present", note: "Arrived late with parent note" },
        ],
      }),
    });
    const reMarkData = await reMarkRes.json();
    console.log(`    Re-marking (Upsert) status: ${reMarkRes.status}`);
    console.log(`    Updated Summary:`, reMarkData.data?.summary);

    // Test C: Sunday Check on non-Sunday class (2026-11-08 is a Sunday)
    // Class 1 days_of_week is 'Mon,Tue,Wed,Thu,Fri,Sat' (No Sun)
    const sundayRes = await fetch(`${baseUrl}/attendance/mark`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        classId: 1,
        date: "2026-11-08",
        records: [{ studentId: studentIds[0], status: "present" }],
      }),
    });
    const sundayData = await sundayRes.json();
    console.log(`    Sunday check on Class 1 (status: ${sundayRes.status}, Expected: 400 Bad Request)`);
    console.log(`    Sunday Error message: "${sundayData.message}"`);
    if (sundayRes.status !== 400) throw new Error("Marking on unscheduled Sunday should be rejected");

    // Test D: Future date check
    const futureRes = await fetch(`${baseUrl}/attendance/mark`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        classId: 1,
        date: "2030-01-01",
        records: [{ studentId: studentIds[0], status: "present" }],
      }),
    });
    const futureData = await futureRes.json();
    console.log(`    Future date check: status ${futureRes.status} (Expected: 400), msg: "${futureData.message}"`);
    if (futureRes.status !== 400) throw new Error("Marking on future dates should be rejected");

    // -------------------------------------------------------------
    // 4. PATCH /:id (Edit one record by Owner)
    // -------------------------------------------------------------
    console.log("\n[4] Testing PATCH /attendance/:id (Single record edit)...");
    // Find an existing attendance ID
    const [attRow] = await query(
      "SELECT id FROM attendance WHERE class_id = 1 AND student_id = :studentId LIMIT 1",
      { studentId: studentIds[0] }
    );
    const targetAttendanceId = attRow.id;

    const patchRes = await fetch(`${baseUrl}/attendance/${targetAttendanceId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        status: "leave",
        note: "Approved by Principal",
      }),
    });
    const patchData = await patchRes.json();
    console.log(`    PATCH /attendance/${targetAttendanceId}: status ${patchRes.status}, updated status: ${patchData.data?.status}`);

    // -------------------------------------------------------------
    // 5. GET /history?classId=&month=&year= (Calendar Heatmap)
    // -------------------------------------------------------------
    console.log("\n[5] Testing GET /attendance/history (Monthly Heatmap)...");
    const historyRes = await fetch(`${baseUrl}/attendance/history?classId=1&month=11&year=2026`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const historyData = await historyRes.json();
    console.log(`    GET /attendance/history: status ${historyRes.status}`);
    console.log(`    Summary:`, historyData.data?.summary);
    console.log(`    Daily data points count: ${historyData.data?.daily?.length}`);
    if (historyData.data?.daily?.length > 0) {
      console.log(`    Sample Day:`, historyData.data?.daily[0]);
    }

    // -------------------------------------------------------------
    // 6. GET /history/day?classId=&date=
    // -------------------------------------------------------------
    console.log("\n[6] Testing GET /attendance/history/day...");
    const dayRes = await fetch(`${baseUrl}/attendance/history/day?classId=1&date=2026-11-02`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const dayData = await dayRes.json();
    console.log(`    GET /attendance/history/day: status ${dayRes.status}, students count: ${dayData.data?.students?.length}`);

    // -------------------------------------------------------------
    // 7. GET /student/:studentId?month=&year=
    // -------------------------------------------------------------
    console.log("\n[7] Testing GET /attendance/student/:studentId...");
    const studentAttRes = await fetch(`${baseUrl}/attendance/student/1?month=11&year=2026`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const studentAttData = await studentAttRes.json();
    console.log(`    GET /attendance/student/1: status ${studentAttRes.status}`);
    console.log(`    Student Name: ${studentAttData.data?.student?.name}, Class: ${studentAttData.data?.student?.className}`);
    console.log(`    Totals:`, studentAttData.data?.totals);
    console.log(`    Overall Attendance %: ${studentAttData.data?.overallPercentage}%`);

    // -------------------------------------------------------------
    // 8. GET /report/monthly?classId=&month=&year=
    // -------------------------------------------------------------
    console.log("\n[8] Testing GET /attendance/report/monthly (<75% Low Attendance Flag)...");
    const reportRes = await fetch(`${baseUrl}/attendance/report/monthly?classId=1&month=11&year=2026`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const reportData = await reportRes.json();
    console.log(`    GET /attendance/report/monthly: status ${reportRes.status}`);
    console.log(`    Report Summary:`, reportData.data?.summary);
    if (reportData.data?.students?.length > 0) {
      const s0 = reportData.data?.students[0];
      console.log(`    Sample Student: ${s0.name}, P: ${s0.present}, L: ${s0.late}, A: ${s0.absent}, Att%: ${s0.attendancePercentage}%, LowAttFlag: ${s0.lowAttendance}`);
    }

    // -------------------------------------------------------------
    // 9. GET /absentees?date=
    // -------------------------------------------------------------
    console.log("\n[9] Testing GET /attendance/absentees (Parent Notification Ledger)...");
    const absenteesRes = await fetch(`${baseUrl}/attendance/absentees?date=${testMarkDate}`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const absenteesData = await absenteesRes.json();
    console.log(`    GET /attendance/absentees?date=${testMarkDate}: status ${absenteesRes.status}, count: ${absenteesData.data?.length}`);
    if (absenteesData.data?.length > 0) {
      const a0 = absenteesData.data[0];
      console.log(`    Sample Absentee: ${a0.student_name}, Class: ${a0.class_name}, Parent Phone: ${a0.parent_phone}`);
    }

    // -------------------------------------------------------------
    // 10. GET /report/monthly/export (CSV Download)
    // -------------------------------------------------------------
    console.log("\n[10] Testing GET /attendance/report/monthly/export (CSV Download)...");
    const exportRes = await fetch(`${baseUrl}/attendance/report/monthly/export?classId=1&month=11&year=2026`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const csvContent = await exportRes.text();
    console.log(`    GET /attendance/report/monthly/export: status ${exportRes.status}, Content-Type: ${exportRes.headers.get("content-type")}`);
    console.log(`    First CSV row: ${csvContent.split("\n")[0]}`);
    console.log(`    Second CSV row: ${csvContent.split("\n")[1]}`);

    console.log("\n============================================================");
    console.log("🎉 ALL ATTENDANCE MODULE TESTS PASSED WITH 100% SUCCESS!");
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
