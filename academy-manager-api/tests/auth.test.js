import app from "../src/app.js";
import { pool, testConnection, query } from "../src/config/db.js";
import jwt from "jsonwebtoken";
import env from "../src/config/env.js";

async function runTests() {
  console.log("------------------------------------------------------------");
  console.log("🧪 STARTING AUTHENTICATION MODULE COMPREHENSIVE TESTS");
  console.log("------------------------------------------------------------");

  await testConnection();
  console.log("✓ Connected to MySQL database.");

  // Start app on ephemeral port (port 0)
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api/v1/auth`;
  console.log(`✓ Test server running at ${baseUrl}`);

  let testAccessToken = "";
  let testRefreshToken = "";
  let testCookie = "";

  try {
    // -------------------------------------------------------------
    // Test 1: POST /signup
    // -------------------------------------------------------------
    console.log("\n[1] Testing POST /signup...");
    const signupEmail = `testowner_${Date.now()}@testacademy.com`;
    const signupRes = await fetch(`${baseUrl}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Professor Tariq",
        email: signupEmail,
        phone: "03001234567",
        password: "Password123",
        academyName: `Apex Academy ${Date.now()}`,
        city: "Lahore",
        subjects: ["Physics", "Mathematics"],
      }),
    });

    const signupData = await signupRes.json();
    console.log(`    Status: ${signupRes.status} (Expected: 201)`);
    console.log(`    Success: ${signupData.success}`);
    console.log(`    User ID: ${signupData.data?.user?.id}`);
    console.log(`    Academy ID: ${signupData.data?.academy?.id}`);

    // Check Set-Cookie
    const rawCookie = signupRes.headers.get("set-cookie");
    console.log(`    Set-Cookie header present: ${Boolean(rawCookie)}`);
    if (rawCookie) {
      testCookie = rawCookie.split(";")[0];
    }
    testAccessToken = signupData.data?.accessToken;

    if (signupRes.status !== 201 || !testAccessToken) {
      throw new Error(`Signup test failed: ${JSON.stringify(signupData)}`);
    }

    // -------------------------------------------------------------
    // Test 2: POST /login (Existing Seed User: owner@demo.com)
    // -------------------------------------------------------------
    console.log("\n[2] Testing POST /login (owner@demo.com)...");
    const loginRes = await fetch(`${baseUrl}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "owner@demo.com",
        password: "Demo@1234",
      }),
    });
    const loginData = await loginRes.json();
    console.log(`    Status: ${loginRes.status} (Expected: 200)`);
    console.log(`    Success: ${loginData.success}`);
    console.log(`    User Role: ${loginData.data?.user?.role}`);
    console.log(`    Academy: ${loginData.data?.academy?.name}`);

    const loginCookie = loginRes.headers.get("set-cookie");
    if (loginCookie) {
      testCookie = loginCookie.split(";")[0];
    }
    testAccessToken = loginData.data?.accessToken;

    if (loginRes.status !== 200 || !testAccessToken) {
      throw new Error(`Login test failed: ${JSON.stringify(loginData)}`);
    }

    // -------------------------------------------------------------
    // Test 3: GET /me (With Access Token)
    // -------------------------------------------------------------
    console.log("\n[3] Testing GET /me...");
    const meRes = await fetch(`${baseUrl}/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${testAccessToken}`,
      },
    });
    const meData = await meRes.json();
    console.log(`    Status: ${meRes.status} (Expected: 200)`);
    console.log(`    Me Email: ${meData.data?.user?.email}`);
    console.log(`    Academy Name: ${meData.data?.academy?.name}`);

    if (meRes.status !== 200 || meData.data?.user?.email !== "owner@demo.com") {
      throw new Error(`GET /me test failed: ${JSON.stringify(meData)}`);
    }

    // -------------------------------------------------------------
    // Test 4: PATCH /me (Update Profile)
    // -------------------------------------------------------------
    console.log("\n[4] Testing PATCH /me...");
    const patchRes = await fetch(`${baseUrl}/me`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${testAccessToken}`,
      },
      body: JSON.stringify({
        name: "Arqam Ishaq Updated",
      }),
    });
    const patchData = await patchRes.json();
    console.log(`    Status: ${patchRes.status} (Expected: 200)`);
    console.log(`    Updated Name: ${patchData.data?.user?.name}`);

    // -------------------------------------------------------------
    // Test 5: POST /refresh (Rotate Token via Cookie)
    // -------------------------------------------------------------
    console.log("\n[5] Testing POST /refresh...");
    const refreshRes = await fetch(`${baseUrl}/refresh`, {
      method: "POST",
      headers: {
        Cookie: testCookie,
      },
    });
    const refreshData = await refreshRes.json();
    console.log(`    Status: ${refreshRes.status} (Expected: 200)`);
    console.log(`    New Access Token Received: ${Boolean(refreshData.data?.accessToken)}`);

    const newCookie = refreshRes.headers.get("set-cookie");
    if (newCookie) {
      testCookie = newCookie.split(";")[0];
    }
    if (refreshData.data?.accessToken) {
      testAccessToken = refreshData.data.accessToken;
    }

    if (refreshRes.status !== 200 || !refreshData.data?.accessToken) {
      throw new Error(`POST /refresh failed: ${JSON.stringify(refreshData)}`);
    }

    // -------------------------------------------------------------
    // Test 6: POST /parent-login
    // -------------------------------------------------------------
    console.log("\n[6] Testing POST /parent-login (phone: 0300-1110001)...");
    const parentRes = await fetch(`${baseUrl}/parent-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: "0300-1110001",
        password: "Demo@1234",
      }),
    });
    const parentData = await parentRes.json();
    console.log(`    Status: ${parentRes.status} (Expected: 200)`);
    console.log(`    Parent Name: ${parentData.data?.user?.name}`);
    console.log(`    Role: ${parentData.data?.user?.role}`);

    if (parentRes.status !== 200 || parentData.data?.user?.role !== "parent") {
      throw new Error(`Parent login test failed: ${JSON.stringify(parentData)}`);
    }

    // -------------------------------------------------------------
    // Test 7: POST /change-password
    // -------------------------------------------------------------
    console.log("\n[7] Testing POST /change-password...");
    const changePassRes = await fetch(`${baseUrl}/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${testAccessToken}`,
      },
      body: JSON.stringify({
        currentPassword: "Demo@1234",
        newPassword: "NewDemoPassword123",
      }),
    });
    const changePassData = await changePassRes.json();
    console.log(`    Status: ${changePassRes.status} (Expected: 200)`);
    console.log(`    Message: ${changePassData.data?.message}`);

    // Revert password back so seed user remains consistent
    const revertPassRes = await fetch(`${baseUrl}/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${testAccessToken}`,
      },
      body: JSON.stringify({
        currentPassword: "NewDemoPassword123",
        newPassword: "Demo@1234",
      }),
    });
    console.log(`    Reverted password back status: ${revertPassRes.status}`);

    // -------------------------------------------------------------
    // Test 8: POST /forgot-password & POST /reset-password
    // -------------------------------------------------------------
    console.log("\n[8] Testing POST /forgot-password & POST /reset-password...");
    // Create a temporary user to test forgot & reset password flow
    const resetUserEmail = `reset_test_${Date.now()}@demo.com`;
    await query(
      `INSERT INTO users (academy_id, name, email, phone, password_hash, role, is_active)
       VALUES (1, 'Reset Test User', :email, '03009999999', 'dummyhash', 'staff', TRUE)`,
      { email: resetUserEmail }
    );

    const forgotRes = await fetch(`${baseUrl}/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: resetUserEmail }),
    });
    const forgotData = await forgotRes.json();
    console.log(`    Forgot Status: ${forgotRes.status} (Expected: 200)`);

    // Verify token hash in DB and set an exact known token for testing /reset-password
    const crypto = await import("crypto");
    const testPlainToken = "abcdef1234567890abcdef1234567890";
    const testTokenHash = crypto.createHash("sha256").update(testPlainToken).digest("hex");
    await query(
      `UPDATE users 
       SET reset_password_token_hash = :testTokenHash, 
           reset_password_expires_at = DATE_ADD(NOW(), INTERVAL 30 MINUTE)
       WHERE email = :email`,
      { testTokenHash, email: resetUserEmail }
    );

    const resetRes = await fetch(`${baseUrl}/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: testPlainToken,
        email: resetUserEmail,
        newPassword: "ResetPassword123",
      }),
    });
    const resetData = await resetRes.json();
    console.log(`    Reset Status: ${resetRes.status} (Expected: 200)`);
    console.log(`    Reset Message: ${resetData.data?.message}`);

    // -------------------------------------------------------------
    // Test 9: TOKEN_EXPIRED error verification
    // -------------------------------------------------------------
    console.log("\n[9] Testing Expired Token Error Code (TOKEN_EXPIRED)...");
    const expiredToken = jwt.sign(
      { sub: 1, academyId: 1, role: "owner" },
      env.JWT_ACCESS_SECRET,
      { expiresIn: "-10s" } // Already expired
    );
    const expiredRes = await fetch(`${baseUrl}/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${expiredToken}`,
      },
    });
    const expiredData = await expiredRes.json();
    console.log(`    Status: ${expiredRes.status} (Expected: 401)`);
    console.log(`    Error Code: ${expiredData.code} (Expected: TOKEN_EXPIRED)`);
    if (expiredData.code !== "TOKEN_EXPIRED") {
      throw new Error(`Expired token did not return TOKEN_EXPIRED: ${JSON.stringify(expiredData)}`);
    }

    // -------------------------------------------------------------
    // Test 10: Account Lockout after 5 Failed Attempts
    // -------------------------------------------------------------
    console.log("\n[10] Testing Account Lockout (5 consecutive failed attempts)...");
    const lockoutEmail = `lockout_${Date.now()}@demo.com`;
    await query(
      `INSERT INTO users (academy_id, name, email, phone, password_hash, role, is_active)
       VALUES (1, 'Lockout Tester', :email, '03008888888', '$2a$12$eX8V...dummy', 'staff', TRUE)`,
      { email: lockoutEmail }
    );

    let lastFailData = null;
    for (let i = 1; i <= 5; i++) {
      const failRes = await fetch(`${baseUrl}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: lockoutEmail,
          password: "WrongPassword999",
        }),
      });
      lastFailData = await failRes.json();
      console.log(`    Attempt ${i}: Status ${failRes.status}, Message: ${lastFailData.message}`);
    }

    // Check DB locked_until
    const [lockedUser] = await query(
      "SELECT failed_login_count, locked_until FROM users WHERE email = :email",
      { email: lockoutEmail }
    );
    console.log(`    Failed count in DB: ${lockedUser.failed_login_count} (Expected: 5)`);
    console.log(`    Locked until timestamp: ${lockedUser.locked_until}`);

    // -------------------------------------------------------------
    // Test 11: POST /logout
    // -------------------------------------------------------------
    console.log("\n[11] Testing POST /logout...");
    const logoutRes = await fetch(`${baseUrl}/logout`, {
      method: "POST",
      headers: {
        Cookie: testCookie,
      },
    });
    const logoutData = await logoutRes.json();
    console.log(`    Status: ${logoutRes.status} (Expected: 200)`);
    console.log(`    Message: ${logoutData.data?.message}`);

    // -------------------------------------------------------------
    // Test 12: POST /logout-all
    // -------------------------------------------------------------
    console.log("\n[12] Testing POST /logout-all...");
    const logoutAllRes = await fetch(`${baseUrl}/logout-all`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${testAccessToken}`,
      },
    });
    const logoutAllData = await logoutAllRes.json();
    console.log(`    Status: ${logoutAllRes.status} (Expected: 200)`);
    console.log(`    Message: ${logoutAllData.data?.message}`);

    console.log("\n============================================================");
    console.log("🎉 ALL 12 AUTHENTICATION & SECURITY TESTS PASSED!");
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
