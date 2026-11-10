import app from "../src/app.js";
import { pool, testConnection, query } from "../src/config/db.js";

async function runTests() {
  console.log("============================================================");
  console.log("🧪 RUNNING COMPREHENSIVE TESTS FOR FEES MODULE");
  console.log("============================================================");

  await testConnection();
  console.log("✓ Connected to MySQL database.");

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api/v1`;
  console.log(`✓ Test server running at ${baseUrl}`);

  try {
    // -------------------------------------------------------------
    // SETUP: Authenticate test personas
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

    // 2. Teacher Login
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
    console.log("\n[1] Testing Fee Module Access Control & Permissions...");

    // Teacher accessing fees -> 403 Forbidden
    const teacherAccess = await fetch(`${baseUrl}/fees`, {
      headers: { Authorization: `Bearer ${teacherToken}` },
    });
    console.log(`    Teacher GET /fees: status ${teacherAccess.status} (expected 403)`);
    if (teacherAccess.status !== 403) {
      throw new Error(`Teacher should receive 403 on fees, got ${teacherAccess.status}`);
    }

    // Parent accessing fees -> 403 Forbidden
    const parentAccess = await fetch(`${baseUrl}/fees`, {
      headers: { Authorization: `Bearer ${parentToken}` },
    });
    console.log(`    Parent GET /fees: status ${parentAccess.status} (expected 403)`);
    if (parentAccess.status !== 403) {
      throw new Error(`Parent should receive 403 on fees, got ${parentAccess.status}`);
    }

    // Owner accessing fees -> 200 OK
    const ownerAccess = await fetch(`${baseUrl}/fees`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    console.log(`    Owner GET /fees: status ${ownerAccess.status} (expected 200)`);
    if (ownerAccess.status !== 200) {
      throw new Error(`Owner should receive 200 on fees, got ${ownerAccess.status}`);
    }

    // -------------------------------------------------------------
    // 2. BULK INVOICE GENERATION & IDEMPOTENCY
    // -------------------------------------------------------------
    console.log("\n[2] Testing POST /fees/generate (Bulk Generation & Idempotency)...");

    // Clean up any test records for period 12/2099 to ensure clean test state
    await query(`DELETE FROM fees WHERE month = 12 AND year = 2099 AND academy_id = 1`);

    // First generation run
    const genRes1 = await fetch(`${baseUrl}/fees/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({ month: 12, year: 2099 }),
    });
    const genData1 = await genRes1.json();
    console.log(`    First run: status ${genRes1.status}, created: ${genData1.data?.created}, skipped: ${genData1.data?.skipped}`);
    if (genRes1.status !== 201 || genData1.data?.created <= 0) {
      throw new Error("First fee generation failed or created 0 records");
    }

    // Second generation run (Idempotency check)
    const genRes2 = await fetch(`${baseUrl}/fees/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({ month: 12, year: 2099 }),
    });
    const genData2 = await genRes2.json();
    console.log(`    Second run (idempotent): status ${genRes2.status}, created: ${genData2.data?.created}, skipped: ${genData2.data?.skipped}`);
    if (genData2.data?.created !== 0 || genData2.data?.skipped !== genData1.data?.created) {
      throw new Error("Idempotency violation! Duplicate fees were created or skipped count is wrong");
    }

    // -------------------------------------------------------------
    // 3. GET /fees (Listing with Filters & Pagination)
    // -------------------------------------------------------------
    console.log("\n[3] Testing GET /fees (Filters, Search, Pagination)...");

    const listRes = await fetch(`${baseUrl}/fees?month=12&year=2099&page=1&limit=5`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const listData = await listRes.json();
    console.log(`    GET /fees: status ${listRes.status}, count: ${listData.data?.length}, total: ${listData.meta?.total}`);
    if (listRes.status !== 200 || !Array.isArray(listData.data) || listData.data.length === 0) {
      throw new Error("Failed to list fees");
    }

    const sampleFee = listData.data[0];
    console.log(`    Sample Fee: Student '${sampleFee.studentName}', Amount: PKR ${sampleFee.amount}, Status: '${sampleFee.status}'`);
    if (sampleFee.balance !== sampleFee.amount || sampleFee.paidAmount !== 0) {
      throw new Error("Initial fee balance mismatch");
    }

    // Test search filter
    const searchRes = await fetch(`${baseUrl}/fees?q=${encodeURIComponent(sampleFee.studentName)}`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const searchData = await searchRes.json();
    console.log(`    Search by name: status ${searchRes.status}, results: ${searchData.data?.length}`);
    if (searchData.data?.length === 0) {
      throw new Error("Search by student name returned 0 results");
    }

    // -------------------------------------------------------------
    // 4. GET /fees/summary (Collection Metrics)
    // -------------------------------------------------------------
    console.log("\n[4] Testing GET /fees/summary...");

    const summaryRes = await fetch(`${baseUrl}/fees/summary?month=12&year=2099`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const summaryData = await summaryRes.json();
    console.log(`    GET /fees/summary: status ${summaryRes.status}`);
    console.log(`    Summary: Expected: ${summaryData.data?.expected}, Collected: ${summaryData.data?.collected}, Pending: ${summaryData.data?.pending}, Collection%: ${summaryData.data?.collectionPercent}%`);
    if (summaryRes.status !== 200 || summaryData.data?.expected <= 0) {
      throw new Error("Summary expected total is invalid");
    }

    // -------------------------------------------------------------
    // 5. POST /fees/payments (Single Payment Collection & Receipt)
    // -------------------------------------------------------------
    console.log("\n[5] Testing POST /fees/payments (Collecting Fee & Generating Receipt)...");

    const targetFee = sampleFee;
    const paymentAmount = 1000;

    const payRes = await fetch(`${baseUrl}/fees/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        feeId: targetFee.id,
        amount: paymentAmount,
        method: "jazzcash",
        note: "Partial tuition fee payment",
      }),
    });
    const payData = await payRes.json();
    console.log(`    POST /fees/payments: status ${payRes.status}, receipt: ${payData.data?.payment?.receiptNo}`);
    if (payRes.status !== 201 || !payData.data?.payment?.receiptNo) {
      throw new Error("Failed to collect payment or generate receipt number");
    }

    const createdPaymentId = payData.data.payment.id;
    const updatedFee = payData.data.updatedFee;
    console.log(`    Updated Fee: Paid: ${updatedFee.paidAmount}, Remaining Balance: ${updatedFee.balance}, Status: '${updatedFee.status}'`);
    if (updatedFee.paidAmount !== paymentAmount || updatedFee.status !== "partial") {
      throw new Error("Fee state after partial payment is incorrect");
    }

    // -------------------------------------------------------------
    // 6. GET /fees/payments/:id/receipt (Printable Receipt Payload)
    // -------------------------------------------------------------
    console.log("\n[6] Testing GET /fees/payments/:id/receipt...");

    const receiptRes = await fetch(`${baseUrl}/fees/payments/${createdPaymentId}/receipt`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const receiptData = await receiptRes.json();
    console.log(`    GET /receipt: status ${receiptRes.status}`);
    console.log(`    Academy: '${receiptData.data?.academy?.name}', Student: '${receiptData.data?.student?.name}', Receipt No: '${receiptData.data?.payment?.receiptNo}'`);
    if (receiptRes.status !== 200 || receiptData.data?.payment?.receiptNo !== payData.data.payment.receiptNo) {
      throw new Error("Receipt details mismatch");
    }

    // -------------------------------------------------------------
    // 7. GET /fees/payments (Transaction History & Range Totals)
    // -------------------------------------------------------------
    console.log("\n[7] Testing GET /fees/payments (Transaction History & Totals)...");

    const paymentsListRes = await fetch(`${baseUrl}/fees/payments?method=jazzcash`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const paymentsListData = await paymentsListRes.json();
    console.log(`    GET /payments: status ${paymentsListRes.status}, count: ${paymentsListData.data?.length}, totalAmount: ${paymentsListData.meta?.rangeTotals?.totalAmount}`);
    if (paymentsListRes.status !== 200 || paymentsListData.data?.length === 0) {
      throw new Error("Payments list returned 0 records");
    }

    // -------------------------------------------------------------
    // 8. GET /fees/student/:studentId (Student Fee Ledger)
    // -------------------------------------------------------------
    console.log("\n[8] Testing GET /fees/student/:studentId...");

    const studentLedgerRes = await fetch(`${baseUrl}/fees/student/${targetFee.studentId}`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const studentLedgerData = await studentLedgerRes.json();
    console.log(`    GET /fees/student/${targetFee.studentId}: status ${studentLedgerRes.status}`);
    console.log(`    Student: '${studentLedgerData.data?.student?.name}', Total Invoices: ${studentLedgerData.data?.summary?.totalInvoicesCount}, Balance: ${studentLedgerData.data?.summary?.totalBalance}`);
    if (studentLedgerRes.status !== 200 || !studentLedgerData.data?.student) {
      throw new Error("Failed to fetch student fee ledger");
    }

    // -------------------------------------------------------------
    // 9. MULTI-MONTH PAYMENT ALLOCATION
    // -------------------------------------------------------------
    console.log("\n[9] Testing Multi-Month Payment Allocation (Oldest Unpaid First)...");

    // Create 2 consecutive unpaid months for student 1: 10/2099 (PKR 1000) and 11/2099 (PKR 1000)
    await query(`DELETE FROM fees WHERE student_id = :studentId AND month IN (10, 11) AND year = 2099`, {
      studentId: targetFee.studentId,
    });

    await query(
      `INSERT INTO fees (academy_id, student_id, month, year, amount, paid_amount, due_date, status, late_fee)
       VALUES 
       (1, :studentId, 10, 2099, 1000, 0, '2099-10-10', 'pending', 0),
       (1, :studentId, 11, 2099, 1000, 0, '2099-11-10', 'pending', 0)`,
      { studentId: targetFee.studentId }
    );

    // Pay PKR 1,500 without specifying feeId: should pay month 10 in full (1000) and month 11 partially (500)
    const multiPayRes = await fetch(`${baseUrl}/fees/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        studentId: targetFee.studentId,
        amount: 1500,
        method: "cash",
        note: "Multi-month payment test",
      }),
    });
    const multiPayData = await multiPayRes.json();
    console.log(`    Multi-month payment: status ${multiPayRes.status}, isMultiMonth: ${multiPayData.data?.isMultiMonth}, payments count: ${multiPayData.data?.payments?.length}`);
    if (multiPayRes.status !== 201 || multiPayData.data?.payments?.length !== 2) {
      throw new Error("Multi-month payment should have created exactly 2 payment allocations");
    }

    // Clean up temporary multi-month records
    await query(`DELETE FROM payments WHERE fee_id IN (SELECT id FROM fees WHERE student_id = :studentId AND month IN (10, 11) AND year = 2099)`, {
      studentId: targetFee.studentId,
    });
    await query(`DELETE FROM fees WHERE student_id = :studentId AND month IN (10, 11) AND year = 2099`, {
      studentId: targetFee.studentId,
    });
    console.log("    ✓ Multi-month payment successfully verified and cleaned up.");

    // -------------------------------------------------------------
    // 10. PATCH /fees/:id (Fee Adjustment & Fully Paid Protection)
    // -------------------------------------------------------------
    console.log("\n[10] Testing PATCH /fees/:id (Adjustment & Business Rules)...");

    // Adjust unpaid or partial fee: add late fee of PKR 150
    const adjustRes = await fetch(`${baseUrl}/fees/${targetFee.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        lateFee: 150,
        note: "Late fee waiver/adjustment applied",
      }),
    });
    const adjustData = await adjustRes.json();
    console.log(`    Adjust fee: status ${adjustRes.status}, new late fee: ${adjustData.data?.lateFee}, new balance: ${adjustData.data?.balance}`);
    if (adjustRes.status !== 200 || adjustData.data?.lateFee !== 150) {
      throw new Error("Failed to adjust fee late fee");
    }

    // -------------------------------------------------------------
    // 11. DELETE /fees/payments/:id (Payment Reversal)
    // -------------------------------------------------------------
    console.log("\n[11] Testing DELETE /fees/payments/:id (Payment Reversal)...");

    const reverseRes = await fetch(`${baseUrl}/fees/payments/${createdPaymentId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        reason: "Entered by mistake during cash reconciliation",
      }),
    });
    const reverseData = await reverseRes.json();
    console.log(`    Payment reversal: status ${reverseRes.status}, message: '${reverseData.data?.message}', fee paidAmount: ${reverseData.data?.updatedFee?.paidAmount}`);
    if (reverseRes.status !== 200 || reverseData.data?.updatedFee?.paidAmount !== 0) {
      throw new Error("Reversal failed to restore fee paid_amount to 0");
    }

    // -------------------------------------------------------------
    // 12. GET /fees/defaulters
    // -------------------------------------------------------------
    console.log("\n[12] Testing GET /fees/defaulters...");

    const defaultersRes = await fetch(`${baseUrl}/fees/defaulters?minMonths=1`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const defaultersData = await defaultersRes.json();
    console.log(`    GET /defaulters: status ${defaultersRes.status}, totalDefaulters: ${defaultersData.data?.totalDefaulters}, totalOverdueAmount: ${defaultersData.data?.totalOverdueAmount}`);
    if (defaultersRes.status !== 200 || !Array.isArray(defaultersData.data?.defaulters)) {
      throw new Error("Failed to fetch defaulters list");
    }

    // -------------------------------------------------------------
    // 13. GET /fees/export (CSV Download)
    // -------------------------------------------------------------
    console.log("\n[13] Testing GET /fees/export (CSV Download)...");

    const exportRes = await fetch(`${baseUrl}/fees/export?month=12&year=2099`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const csvContent = await exportRes.text();
    const contentType = exportRes.headers.get("content-type");
    console.log(`    GET /export: status ${exportRes.status}, Content-Type: ${contentType}`);
    console.log(`    First CSV Line: '${csvContent.split("\r\n")[0]}'`);
    if (exportRes.status !== 200 || !csvContent.includes("Roll No,Student Name")) {
      throw new Error("CSV export header mismatch or invalid format");
    }

    // -------------------------------------------------------------
    // 14. GET & PUT /fees/structure (Fee Structure Management)
    // -------------------------------------------------------------
    console.log("\n[14] Testing GET & PUT /fees/structure...");

    const structGetRes = await fetch(`${baseUrl}/fees/structure`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const structGetData = await structGetRes.json();
    console.log(`    GET /structure: status ${structGetRes.status}, totalClasses: ${structGetData.data?.totalClasses}, totalActiveStudents: ${structGetData.data?.totalActiveStudents}`);
    if (structGetRes.status !== 200 || !Array.isArray(structGetData.data?.classes)) {
      throw new Error("Failed to get fee structure");
    }

    const firstClass = structGetData.data.classes[0];
    const originalFee = firstClass.monthlyFee;

    const structPutRes = await fetch(`${baseUrl}/fees/structure`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        updates: [{ classId: firstClass.classId, monthlyFee: originalFee }],
        applyToActiveStudents: false,
      }),
    });
    const structPutData = await structPutRes.json();
    console.log(`    PUT /structure: status ${structPutRes.status}, updatedClassesCount: ${structPutData.data?.updatedClassesCount}`);
    if (structPutRes.status !== 200) {
      throw new Error("Failed to update fee structure");
    }

    console.log("\n============================================================");
    console.log("🎉 ALL FEES MODULE TESTS PASSED WITH 100% SUCCESS!");
    console.log("============================================================");
  } finally {
    // Cleanup generated 12/2099 test fees
    await query(`DELETE FROM payments WHERE fee_id IN (SELECT id FROM fees WHERE month = 12 AND year = 2099 AND academy_id = 1)`);
    await query(`DELETE FROM fees WHERE month = 12 AND year = 2099 AND academy_id = 1`);
    console.log("✓ Cleaned up 12/2099 test fee records.");

    server.close();
    await pool.end();
  }
}

runTests().catch((err) => {
  console.error("❌ Test failed with error:", err);
  process.exit(1);
});

