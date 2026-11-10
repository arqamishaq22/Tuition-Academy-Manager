import app from "../src/app.js";
import { pool, testConnection, query } from "../src/config/db.js";

async function runConcurrencyTest() {
  console.log("============================================================");
  console.log("⚡ RUNNING CONCURRENCY RACE-CONDITION TEST FOR FEES");
  console.log("============================================================");

  await testConnection();
  console.log("✓ Connected to MySQL database.");

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api/v1`;
  console.log(`✓ Test server running at ${baseUrl}`);

  let testFeeId = null;
  const testStudentId = 1; // Existing student in academy 1

  try {
    // 1. Authenticate as Owner
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "owner@demo.com", password: "Demo@1234" }),
    });
    const loginData = await loginRes.json();
    const token = loginData.data?.accessToken;
    if (!token) {
      throw new Error("Failed to authenticate as owner");
    }
    console.log("✓ Authenticated as Owner.");

    // 2. Insert an isolated test fee row: PKR 5000 invoice
    // Month 12, Year 2098 (so it won't collide with any actual data)
    await query(
      `DELETE FROM fees WHERE student_id = :studentId AND month = 12 AND year = 2098`,
      { studentId: testStudentId }
    );

    const [insertResult] = await pool.query(
      `INSERT INTO fees (academy_id, student_id, month, year, amount, paid_amount, due_date, status, late_fee)
       VALUES (1, :studentId, 12, 2098, 5000, 0, '2098-12-10', 'pending', 0)`,
      { studentId: testStudentId }
    );
    testFeeId = insertResult.insertId;
    console.log(`✓ Created isolated test fee ID ${testFeeId} with PKR 5,000 balance.`);

    // -------------------------------------------------------------
    // SCENARIO 1: Concurrent Overdraw Attempt
    // Remaining balance: PKR 5,000.
    // Client 1 attempts: PKR 3,500.
    // Client 2 attempts: PKR 3,500.
    // Total requested: PKR 7,000 (> 5,000).
    // Expected: Exactly ONE succeeds (201), exactly ONE rejected (400).
    // -------------------------------------------------------------
    console.log("\n[SCENARIO 1] Firing 2 simultaneous payments of PKR 3,500 on PKR 5,000 fee...");

    const payAttempt = (amount, note) =>
      fetch(`${baseUrl}/fees/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          feeId: testFeeId,
          amount,
          method: "cash",
          note,
        }),
      });

    const [res1, res2] = await Promise.all([
      payAttempt(3500, "Concurrent Payment A"),
      payAttempt(3500, "Concurrent Payment B"),
    ]);

    const data1 = await res1.json();
    const data2 = await res2.json();

    console.log(`    Request 1 response: status ${res1.status}, success: ${data1.success}`);
    console.log(`    Request 2 response: status ${res2.status}, success: ${data2.success}`);

    const statuses = [res1.status, res2.status].sort();
    if (statuses[0] !== 201 || statuses[1] !== 400) {
      throw new Error(
        `Concurrency failure! Expected one 201 and one 400, got: ${statuses.join(", ")}`
      );
    }
    console.log("✓ Concurrency protection verified! Overdraw was safely rejected.");

    // Verify DB state after Scenario 1
    const [feeAfterS1] = await query(`SELECT paid_amount, status FROM fees WHERE id = :id`, {
      id: testFeeId,
    });
    console.log(
      `✓ DB Verification: paid_amount is ${feeAfterS1.paid_amount} PKR (expected 3500), status is '${feeAfterS1.status}'.`
    );
    if (feeAfterS1.paid_amount !== 3500) {
      throw new Error(`Expected paid_amount 3500, found ${feeAfterS1.paid_amount}`);
    }

    // -------------------------------------------------------------
    // SCENARIO 2: Concurrent Non-Overlapping Payments
    // Remaining balance: PKR 1,500.
    // Client 3 attempts: PKR 500.
    // Client 4 attempts: PKR 1,000.
    // Total requested: PKR 1,500 (= 1,500).
    // Expected: BOTH succeed (201), sequential receipt numbers, total exactly 5,000.
    // -------------------------------------------------------------
    console.log("\n[SCENARIO 2] Firing 2 simultaneous payments totaling remaining PKR 1,500 (500 + 1000)...");

    const [res3, res4] = await Promise.all([
      payAttempt(500, "Concurrent Payment C"),
      payAttempt(1000, "Concurrent Payment D"),
    ]);

    const data3 = await res3.json();
    const data4 = await res4.json();

    console.log(`    Request 3 response: status ${res3.status}, receipt: ${data3.data?.payment?.receiptNo}`);
    console.log(`    Request 4 response: status ${res4.status}, receipt: ${data4.data?.payment?.receiptNo}`);

    if (res3.status !== 201 || res4.status !== 201) {
      throw new Error(`Expected both requests to succeed with 201, got ${res3.status} and ${res4.status}`);
    }

    const rcpt3 = data3.data?.payment?.receiptNo;
    const rcpt4 = data4.data?.payment?.receiptNo;
    if (rcpt3 === rcpt4) {
      throw new Error(`Duplicate receipt number generated: ${rcpt3}`);
    }
    console.log("✓ Sequential unique receipt numbers confirmed with no collision.");

    // Verify final DB state
    const [finalFee] = await query(`SELECT paid_amount, status FROM fees WHERE id = :id`, {
      id: testFeeId,
    });
    console.log(
      `✓ Final DB Verification: paid_amount is ${finalFee.paid_amount} PKR (expected 5000), status is '${finalFee.status}'.`
    );
    if (finalFee.paid_amount !== 5000 || finalFee.status !== "paid") {
      throw new Error(
        `Final fee state invalid: paid_amount ${finalFee.paid_amount}, status ${finalFee.status}`
      );
    }

    console.log("\n============================================================");
    console.log("🎉 CONCURRENCY TEST PASSED FLAWLESSLY!");
    console.log("============================================================");
  } finally {
    // Cleanup test fee & payments
    if (testFeeId) {
      await query(`DELETE FROM payments WHERE fee_id = :id`, { id: testFeeId });
      await query(`DELETE FROM fees WHERE id = :id`, { id: testFeeId });
      console.log("✓ Cleaned up test records.");
    }
    server.close();
    await pool.end();
  }
}

runConcurrencyTest().catch((err) => {
  console.error("❌ Concurrency test failed with error:", err);
  process.exit(1);
});
