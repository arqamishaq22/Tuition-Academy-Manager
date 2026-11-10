import path from "path";
import fs from "fs";
import app from "../src/app.js";
import { pool, testConnection, query } from "../src/config/db.js";
import storageService from "../src/services/storage.js";
import messagingService from "../src/services/messaging/index.js";

async function runTests() {
  console.log("==================================================================");
  console.log("🧪 RUNNING TESTS: REMINDERS, CRON JOBS & UPLOAD/STORAGE MODULES");
  console.log("==================================================================");

  await testConnection();
  console.log("✓ Connected to MySQL database.");

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api/v1`;
  console.log(`✓ Test server running at ${baseUrl}`);

  try {
    // -------------------------------------------------------------
    // AUTH SETUP: Login Owner, Staff, and Parent
    // -------------------------------------------------------------
    console.log("\n[AUTH SETUP] Logging in test personas...");

    // 1. Academy 1 Owner (owner@demo.com)
    const ownerRes = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "owner@demo.com", password: "Demo@1234" }),
    });
    const ownerData = await ownerRes.json();
    const ownerToken = ownerData.data?.accessToken;
    console.log(`    Owner Login: status ${ownerRes.status}, token: ${Boolean(ownerToken)}`);

    // 2. Academy 1 Teacher (hamza@brightfuture.edu.pk)
    const teacherRes = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "hamza@brightfuture.edu.pk", password: "Demo@1234" }),
    });
    const teacherData = await teacherRes.json();
    const teacherToken = teacherData.data?.accessToken;
    console.log(`    Teacher Login: status ${teacherRes.status}, token: ${Boolean(teacherToken)}`);

    // 3. Parent Login (0300-1110001)
    const parentRes = await fetch(`${baseUrl}/auth/parent-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: "0300-1110001", password: "Demo@1234" }),
    });
    const parentData = await parentRes.json();
    const parentToken = parentData.data?.accessToken;
    console.log(`    Parent Login: status ${parentRes.status}, token: ${Boolean(parentToken)}`);

    // =========================================================================
    // PART A: ACCESS CONTROL & REMINDERS MODULE
    // =========================================================================
    console.log("\n[1] Testing Reminders Access Control (Owner & Staff Only)...");

    // 1.1 Unauthenticated -> 401
    const unauth = await fetch(`${baseUrl}/reminders/fees/preview`, { method: "POST" });
    console.log(`    Unauthenticated /reminders/fees/preview: status ${unauth.status} (expected 401)`);
    if (unauth.status !== 401) throw new Error("Expected 401 for unauthenticated request");

    // 1.2 Teacher -> 403 Forbidden
    const teacherBlocked = await fetch(`${baseUrl}/reminders/fees/preview`, {
      method: "POST",
      headers: { Authorization: `Bearer ${teacherToken}` },
    });
    console.log(`    Teacher -> /reminders/fees/preview: status ${teacherBlocked.status} (expected 403)`);
    if (teacherBlocked.status !== 403) throw new Error("Expected 403 for teacher accessing reminders");

    // 1.3 Parent -> 403 Forbidden
    const parentBlocked = await fetch(`${baseUrl}/reminders/fees/preview`, {
      method: "POST",
      headers: { Authorization: `Bearer ${parentToken}` },
    });
    console.log(`    Parent -> /reminders/fees/preview: status ${parentBlocked.status} (expected 403)`);
    if (parentBlocked.status !== 403) throw new Error("Expected 403 for parent accessing reminders");

    console.log("\n[2] Testing Fee Reminder Preview & wa.me Links...");

    // 2.1 POST /reminders/fees/preview (preview fee reminders with seed data)
    const previewRes = await fetch(`${baseUrl}/reminders/fees/preview`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        month: 10,
        year: 2026,
      }),
    });
    const previewData = await previewRes.json();
    console.log(`    POST /reminders/fees/preview: status ${previewRes.status}, items: ${previewData.data.length}`);
    if (previewRes.status !== 200 || !Array.isArray(previewData.data)) {
      throw new Error("Failed fee reminder preview");
    }

    if (previewData.data.length > 0) {
      const sample = previewData.data[0];
      console.log(`    Sample Student: ${sample.studentName} (${sample.className}), Phone: ${sample.parentPhone} -> ${sample.internationalPhone}`);
      console.log(`    Message: "${sample.message}"`);
      console.log(`    WhatsApp Link: ${sample.waLink}`);
      if (!sample.waLink.startsWith("https://wa.me/923")) {
        throw new Error("Invalid wa.me link generated");
      }
    }

    // 2.2 POST /reminders/fees/send & 24h Rate Limiting
    console.log("\n[3] Testing Fee Reminder Send & 24-Hour Rate Limiting...");
    const targetFeeId = previewData.data.length > 0 ? previewData.data[0].feeId : 1;

    // Clear previous test logs for idempotency
    await query("DELETE FROM reminder_logs WHERE academy_id = 1 AND fee_id = ?", [targetFeeId]);

    // First send attempt
    const sendRes1 = await fetch(`${baseUrl}/reminders/fees/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        feeIds: [targetFeeId],
        force: false,
      }),
    });
    const sendData1 = await sendRes1.json();
    console.log(`    1st Send Attempt: status ${sendRes1.status}, Sent: ${sendData1.data.sentCount}, Skipped: ${sendData1.data.skippedCount}`);
    if (sendRes1.status !== 200 || sendData1.data.sentCount !== 1) {
      throw new Error("Expected 1 reminder to be logged as sent on first attempt");
    }

    // Second send attempt immediately (should be skipped due to 24-hour limit)
    const sendRes2 = await fetch(`${baseUrl}/reminders/fees/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        feeIds: [targetFeeId],
        force: false,
      }),
    });
    const sendData2 = await sendRes2.json();
    console.log(`    2nd Send Attempt (within 24h): status ${sendRes2.status}, Sent: ${sendData2.data.sentCount}, Skipped: ${sendData2.data.skippedCount}`);
    if (sendData2.data.skippedCount !== 1) {
      throw new Error("Expected 24-hour rate limit to skip reminder");
    }

    // Third send attempt with force=true (should bypass 24h limit)
    const sendRes3 = await fetch(`${baseUrl}/reminders/fees/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        feeIds: [targetFeeId],
        force: true,
      }),
    });
    const sendData3 = await sendRes3.json();
    console.log(`    3rd Send Attempt (force=true): status ${sendRes3.status}, Sent: ${sendData3.data.sentCount}, Skipped: ${sendData3.data.skippedCount}`);
    if (sendData3.data.sentCount !== 1) {
      throw new Error("Expected force=true to override 24-hour rate limit");
    }

    // 2.3 POST /reminders/absent (absent student notification)
    console.log("\n[4] Testing Absent Student Alerts & Receipt Reminders...");
    const absentRes = await fetch(`${baseUrl}/reminders/absent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        date: "2026-11-06",
      }),
    });
    const absentData = await absentRes.json();
    console.log(`    POST /reminders/absent: status ${absentRes.status}, items: ${absentData.data.length}`);
    if (absentRes.status !== 200) throw new Error("Failed absent reminders");

    // 2.4 POST /reminders/receipt/:paymentId
    // Fetch a sample payment ID from DB
    const payRows = await query(`SELECT id FROM payments WHERE academy_id = 1 LIMIT 1`);
    if (payRows.length > 0) {
      const paymentId = payRows[0].id;
      const receiptRes = await fetch(`${baseUrl}/reminders/receipt/${paymentId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${ownerToken}` },
      });
      const receiptData = await receiptRes.json();
      console.log(`    POST /reminders/receipt/${paymentId}: status ${receiptRes.status}, ReceiptNo: ${receiptData.data.receiptNo}`);
      console.log(`    Receipt Message: "${receiptData.data.message}"`);
      console.log(`    Receipt Link: ${receiptData.data.waLink}`);
      if (receiptRes.status !== 200 || !receiptData.data.waLink.startsWith("https://wa.me/")) {
        throw new Error("Failed receipt reminder link");
      }
    }

    // 2.5 POST /reminders/result/:examId/:studentId
    const examStudentRes = await fetch(`${baseUrl}/reminders/result/1/1`, {
      method: "POST",
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const examStudentData = await examStudentRes.json();
    console.log(`    POST /reminders/result/1/1: status ${examStudentRes.status}, Grade: ${examStudentData.data.grade}`);
    console.log(`    Result Message: "${examStudentData.data.message}"`);
    if (examStudentRes.status !== 200) throw new Error("Failed result reminder link");

    // 2.6 GET /reminders/logs
    const logsRes = await fetch(`${baseUrl}/reminders/logs?limit=5`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const logsData = await logsRes.json();
    console.log(`    GET /reminders/logs: status ${logsRes.status}, total logs: ${logsData.data.length}`);
    if (logsRes.status !== 200 || logsData.data.length === 0) throw new Error("Failed to query reminder logs");

    // =========================================================================
    // PART B: SCHEDULED CRON JOBS EXECUTION & MANUAL ADMIN TRIGGER
    // =========================================================================
    console.log("\n[5] Testing Cron Jobs (Manual Trigger & Verification)...");

    // 5.1 GET /admin/jobs (list available jobs)
    const listJobsRes = await fetch(`${baseUrl}/admin/jobs`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const listJobsData = await listJobsRes.json();
    console.log(`    GET /admin/jobs: status ${listJobsRes.status}, registered jobs: ${listJobsData.data.map((j) => j.name).join(", ")}`);
    if (listJobsRes.status !== 200 || listJobsData.data.length !== 4) {
      throw new Error("Expected 4 registered cron jobs");
    }

    // 5.2 Trigger Job 1: generateMonthlyFees
    const runJob1Res = await fetch(`${baseUrl}/admin/jobs/generateMonthlyFees/run`, {
      method: "POST",
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const runJob1Data = await runJob1Res.json();
    console.log(`    POST /admin/jobs/generateMonthlyFees/run: status ${runJob1Res.status}, Created=${runJob1Data.data.details.grandCreated}, Skipped=${runJob1Data.data.details.grandSkipped}`);
    if (runJob1Res.status !== 200) throw new Error("Failed to run generateMonthlyFees job");

    // 5.3 Trigger Job 2: markOverdueFees
    const runJob2Res = await fetch(`${baseUrl}/admin/jobs/markOverdueFees/run`, {
      method: "POST",
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const runJob2Data = await runJob2Res.json();
    console.log(`    POST /admin/jobs/markOverdueFees/run: status ${runJob2Res.status}, UpdatedInvoices=${runJob2Data.data.details.updatedCount}`);
    if (runJob2Res.status !== 200) throw new Error("Failed to run markOverdueFees job");

    // 5.4 Trigger Job 3: dueSoonReminders
    const runJob3Res = await fetch(`${baseUrl}/admin/jobs/dueSoonReminders/run`, {
      method: "POST",
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const runJob3Data = await runJob3Res.json();
    console.log(`    POST /admin/jobs/dueSoonReminders/run: status ${runJob3Res.status}, GrandQueued=${runJob3Data.data.details.grandQueued}`);
    if (runJob3Res.status !== 200) throw new Error("Failed to run dueSoonReminders job");

    // 5.5 Check GET /reminders/queue & POST /reminders/queue/send
    const queueRes = await fetch(`${baseUrl}/reminders/queue`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const queueData = await queueRes.json();
    console.log(`    GET /reminders/queue: status ${queueRes.status}, pending queued reminders: ${queueData.data.length}`);
    if (queueRes.status !== 200) throw new Error("Failed to fetch queued reminders");

    if (queueData.data.length > 0) {
      const sendQueueRes = await fetch(`${baseUrl}/reminders/queue/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ownerToken}`,
        },
        body: JSON.stringify({
          reminderIds: [queueData.data[0].reminderId],
        }),
      });
      const sendQueueData = await sendQueueRes.json();
      console.log(`    POST /reminders/queue/send: status ${sendQueueRes.status}, SentCount: ${sendQueueData.data.sentCount}`);
      if (sendQueueRes.status !== 200 || sendQueueData.data.sentCount !== 1) {
        throw new Error("Failed to mark queued reminder as sent");
      }
    }

    // 5.6 Trigger Job 4: cleanup
    const runJob4Res = await fetch(`${baseUrl}/admin/jobs/cleanup/run`, {
      method: "POST",
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const runJob4Data = await runJob4Res.json();
    console.log(`    POST /admin/jobs/cleanup/run: status ${runJob4Res.status}, TokensDeleted=${runJob4Data.data.details.tokensDeleted}, ResetTokensCleared=${runJob4Data.data.details.resetTokensCleared}`);
    if (runJob4Res.status !== 200) throw new Error("Failed to run cleanup job");

    // =========================================================================
    // PART C: FILE UPLOADS, STORAGE SERVICE & SAFE HEADERS
    // =========================================================================
    console.log("\n[6] Testing Storage Service & Static File Serving with Safe Headers...");

    // 6.1 Test Storage Service Save & Replace & Delete
    const testBuffer = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");
    const testFilePath = path.resolve(process.cwd(), "uploads", "logos", "test-pixel.png");
    await fs.promises.writeFile(testFilePath, testBuffer);

    const savedRecord = await storageService.save(
      { filename: "test-pixel.png", size: testBuffer.length, mimetype: "image/png" },
      "logos"
    );
    console.log(`    StorageService Save: URL=${savedRecord.url}, Provider=${savedRecord.provider}`);
    if (savedRecord.url !== "/uploads/logos/test-pixel.png") throw new Error("Invalid storage URL");

    const deleted = await storageService.delete("/uploads/logos/test-pixel.png");
    console.log(`    StorageService Delete: deleted=${deleted}`);
    if (!deleted) throw new Error("Failed to delete stored file");

    // 6.2 Test Static File Serving with Safe Headers
    const dummyLogoPath = path.resolve(process.cwd(), "uploads", "logos", "dummy-logo.png");
    await fs.promises.writeFile(dummyLogoPath, testBuffer);

    const staticRes = await fetch(`http://localhost:${port}/uploads/logos/dummy-logo.png`);
    const corpHeader = staticRes.headers.get("cross-origin-resource-policy");
    const nosniffHeader = staticRes.headers.get("x-content-type-options");
    console.log(`    Static /uploads Header Check: status ${staticRes.status}`);
    console.log(`    Cross-Origin-Resource-Policy: "${corpHeader}" (expected cross-origin)`);
    console.log(`    X-Content-Type-Options: "${nosniffHeader}" (expected nosniff)`);

    if (corpHeader !== "cross-origin" || nosniffHeader !== "nosniff") {
      throw new Error("Missing safe security headers on /uploads");
    }

    // Clean up dummy logo
    await fs.promises.unlink(dummyLogoPath);

    console.log("\n==================================================================");
    console.log("✅ ALL REMINDERS, CRON JOBS & STORAGE TESTS PASSED (100%)");
    console.log("==================================================================");
  } finally {
    server.close();
    await pool.end();
  }
}

runTests().catch((err) => {
  console.error("❌ Test suite failed:", err);
  process.exit(1);
});
