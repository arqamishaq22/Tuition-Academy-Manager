import app from "../src/app.js";
import { pool, testConnection, query } from "../src/config/db.js";

async function runTests() {
  console.log("==================================================================");
  console.log("🧪 RUNNING TESTS: PARENT PORTAL, NOTICES & SETTINGS MODULES");
  console.log("==================================================================");

  await testConnection();
  console.log("✓ Connected to MySQL database.");

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api/v1`;
  console.log(`✓ Test server running at ${baseUrl}`);

  try {
    // -------------------------------------------------------------
    // AUTH SETUP: Login personas
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
    console.log(`    Academy 1 Owner Login: status ${ownerRes.status}, token: ${Boolean(ownerToken)}`);

    // 2. Academy 1 Teacher (hamza@brightfuture.edu.pk, assigned to Class 1 & 2)
    const teacherRes = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "hamza@brightfuture.edu.pk", password: "Demo@1234" }),
    });
    const teacherData = await teacherRes.json();
    const teacherToken = teacherData.data?.accessToken;
    console.log(`    Academy 1 Teacher Login: status ${teacherRes.status}, token: ${Boolean(teacherToken)}`);

    // 3. Parent A (Tariq Mehmood, phone: 0300-1110001, owns Student 1, 3, 20, 32)
    const parentARes = await fetch(`${baseUrl}/auth/parent-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: "0300-1110001", password: "Demo@1234" }),
    });
    const parentAData = await parentARes.json();
    const parentAToken = parentAData.data?.accessToken;
    console.log(`    Parent A Login: status ${parentARes.status}, token: ${Boolean(parentAToken)}`);

    // 4. Parent B (Muhammad Asif, phone: 0300-1110002, owns Student 2, 7, 22, 33)
    const parentBRes = await fetch(`${baseUrl}/auth/parent-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: "0300-1110002", password: "Demo@1234" }),
    });
    const parentBData = await parentBRes.json();
    const parentBToken = parentBData.data?.accessToken;
    console.log(`    Parent B Login: status ${parentBRes.status}, token: ${Boolean(parentBToken)}`);

    // 5. Academy 2 Owner (Signup new academy to test cross-tenant isolation)
    const signupRes = await fetch(`${baseUrl}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Tenant 2 Owner",
        email: `tenant2.${Date.now()}@test.com`,
        phone: "0321-9999888",
        password: "Password@1234",
        academyName: `Tenant 2 Academy ${Date.now()}`,
        city: "Islamabad",
      }),
    });
    const signupData = await signupRes.json();
    const academy2Token = signupData.data?.accessToken;
    console.log(`    Academy 2 Owner Signup & Login: token: ${Boolean(academy2Token)}`);

    // =========================================================================
    // PART A: PARENT PORTAL FUNCTIONALITY & SECURITY
    // =========================================================================
    console.log("\n[1] Testing Parent Portal Endpoints for Parent A (Student 1)...");

    // 1.1 List children of Parent A
    const childrenRes = await fetch(`${baseUrl}/parent/children`, {
      headers: { Authorization: `Bearer ${parentAToken}` },
    });
    const childrenData = await childrenRes.json();
    console.log(`    GET /parent/children: status ${childrenRes.status}, children count: ${childrenData.data.length}`);
    if (childrenRes.status !== 200 || !Array.isArray(childrenData.data) || childrenData.data.length === 0) {
      throw new Error("Failed to fetch Parent A's children");
    }
    const student1 = childrenData.data[0];
    console.log(`    First Child: ID=${student1.id}, Name="${student1.name}", Class="${student1.className}", Attendance%=${student1.attendancePercentageThisMonth}%, PendingFee=${student1.pendingFee} PKR`);

    // 1.2 Child Summary Header Data
    const summaryRes = await fetch(`${baseUrl}/parent/children/1/summary`, {
      headers: { Authorization: `Bearer ${parentAToken}` },
    });
    const summaryData = await summaryRes.json();
    console.log(`    GET /parent/children/1/summary: status ${summaryRes.status}, Student="${summaryData.data.student.name}", Teacher="${summaryData.data.student.classTeacherName}"`);
    if (summaryRes.status !== 200 || summaryData.data.student.id !== 1) {
      throw new Error("Failed child summary");
    }

    // 1.3 Child Attendance Calendar & Totals
    const attRes = await fetch(`${baseUrl}/parent/children/1/attendance?month=10&year=2026`, {
      headers: { Authorization: `Bearer ${parentAToken}` },
    });
    const attData = await attRes.json();
    console.log(`    GET /parent/children/1/attendance: status ${attRes.status}, MarkedDays=${attData.data.summary.totalMarked}, Att%=${attData.data.summary.percentage}%`);
    if (attRes.status !== 200) throw new Error("Failed child attendance");

    // 1.4 Child Fee Ledger
    const feeRes = await fetch(`${baseUrl}/parent/children/1/fees`, {
      headers: { Authorization: `Bearer ${parentAToken}` },
    });
    const feeData = await feeRes.json();
    console.log(`    GET /parent/children/1/fees: status ${feeRes.status}, InvoicesCount=${feeData.data.fees.length}, Outstanding=${feeData.data.totalOutstanding} PKR`);
    if (feeRes.status !== 200) throw new Error("Failed child fees");

    // 1.5 Child Fee Receipt (for a fee with payment)
    const paidFee = feeData.data.fees.find((f) => f.paidAmount > 0);
    if (paidFee) {
      const receiptRes = await fetch(`${baseUrl}/parent/children/1/fees/${paidFee.feeId}/receipt`, {
        headers: { Authorization: `Bearer ${parentAToken}` },
      });
      const receiptData = await receiptRes.json();
      console.log(`    GET /parent/children/1/fees/${paidFee.feeId}/receipt: status ${receiptRes.status}, Academy="${receiptData.data.academy.name}", Paid=${receiptData.data.invoice.paidAmount} PKR`);
      if (receiptRes.status !== 200) throw new Error("Failed child fee receipt");
    }

    // 1.6 Child Results (Published Exams)
    const resultsRes = await fetch(`${baseUrl}/parent/children/1/results`, {
      headers: { Authorization: `Bearer ${parentAToken}` },
    });
    const resultsData = await resultsRes.json();
    console.log(`    GET /parent/children/1/results: status ${resultsRes.status}, PublishedExams=${resultsData.data.results.length}`);
    if (resultsRes.status !== 200) throw new Error("Failed child results");

    // 1.7 Child Report Card
    if (resultsData.data.results.length > 0) {
      const examId = resultsData.data.results[0].examId;
      const cardRes = await fetch(`${baseUrl}/parent/children/1/results/${examId}/report-card`, {
        headers: { Authorization: `Bearer ${parentAToken}` },
      });
      const cardData = await cardRes.json();
      console.log(`    GET /parent/children/1/results/${examId}/report-card: status ${cardRes.status}, Exam="${cardData.data.exam.name}", Grade=${cardData.data.summary.grade}`);
      if (cardRes.status !== 200) throw new Error("Failed child report card");
    }

    // 1.8 Parent Visible Notices
    const noticesRes = await fetch(`${baseUrl}/parent/notices`, {
      headers: { Authorization: `Bearer ${parentAToken}` },
    });
    const noticesData = await noticesRes.json();
    console.log(`    GET /parent/notices: status ${noticesRes.status}, NoticesCount=${noticesData.data.length}`);
    if (noticesRes.status !== 200) throw new Error("Failed parent notices");

    // 1.9 Mark Notice as Read
    if (noticesData.data.length > 0) {
      const noticeId = noticesData.data[0].id;
      const readRes = await fetch(`${baseUrl}/parent/notices/${noticeId}/read`, {
        method: "POST",
        headers: { Authorization: `Bearer ${parentAToken}` },
      });
      console.log(`    POST /parent/notices/${noticeId}/read: status ${readRes.status}`);
      if (readRes.status !== 200) throw new Error("Failed mark notice read");
    }

    // 1.10 Academy Contact
    const contactRes = await fetch(`${baseUrl}/parent/academy-contact`, {
      headers: { Authorization: `Bearer ${parentAToken}` },
    });
    const contactData = await contactRes.json();
    console.log(`    GET /parent/academy-contact: status ${contactRes.status}, Academy="${contactData.data.name}", WhatsApp="${contactData.data.whatsAppLink}"`);
    if (contactRes.status !== 200 || !contactData.data.whatsAppLink.startsWith("https://wa.me/")) {
      throw new Error("Failed academy contact / whatsapp link");
    }

    // =========================================================================
    // SECURITY TESTS: PARENT A CANNOT ACCESS PARENT B'S CHILD (MUST RETURN 404)
    // =========================================================================
    console.log("\n[2] Testing Critical Parent Privacy & Security (Parent A accessing Parent B's Student 2)...");

    // Parent A attempts to access Student 2's summary -> 404
    const sec1 = await fetch(`${baseUrl}/parent/children/2/summary`, {
      headers: { Authorization: `Bearer ${parentAToken}` },
    });
    console.log(`    Parent A -> GET /parent/children/2/summary: status ${sec1.status} (expected 404)`);
    if (sec1.status !== 404) throw new Error(`Expected 404 when Parent A accesses Student 2, got ${sec1.status}`);

    // Parent A attempts to access Student 2's attendance -> 404
    const sec2 = await fetch(`${baseUrl}/parent/children/2/attendance`, {
      headers: { Authorization: `Bearer ${parentAToken}` },
    });
    console.log(`    Parent A -> GET /parent/children/2/attendance: status ${sec2.status} (expected 404)`);
    if (sec2.status !== 404) throw new Error(`Expected 404 when Parent A accesses Student 2 attendance, got ${sec2.status}`);

    // Parent A attempts to access Student 2's fees -> 404
    const sec3 = await fetch(`${baseUrl}/parent/children/2/fees`, {
      headers: { Authorization: `Bearer ${parentAToken}` },
    });
    console.log(`    Parent A -> GET /parent/children/2/fees: status ${sec3.status} (expected 404)`);
    if (sec3.status !== 404) throw new Error(`Expected 404 when Parent A accesses Student 2 fees, got ${sec3.status}`);

    // Parent A attempts to access Student 2's results -> 404
    const sec4 = await fetch(`${baseUrl}/parent/children/2/results`, {
      headers: { Authorization: `Bearer ${parentAToken}` },
    });
    console.log(`    Parent A -> GET /parent/children/2/results: status ${sec4.status} (expected 404)`);
    if (sec4.status !== 404) throw new Error(`Expected 404 when Parent A accesses Student 2 results, got ${sec4.status}`);

    // Parent attempting to access staff/owner routes -> 403 Forbidden
    const sec5 = await fetch(`${baseUrl}/settings`, {
      headers: { Authorization: `Bearer ${parentAToken}` },
    });
    console.log(`    Parent -> GET /settings: status ${sec5.status} (expected 403)`);
    if (sec5.status !== 403) throw new Error("Expected 403 for parent accessing /settings");

    // =========================================================================
    // MULTI-TENANT ISOLATION: ACADEMY 2 CANNOT ACCESS ACADEMY 1 DATA
    // =========================================================================
    console.log("\n[3] Testing Multi-Tenant Cross-Academy Isolation (Academy 2 accessing Academy 1 data)...");

    // Endpoint 1: Notice 1 (Academy 1) accessed by Academy 2 owner -> 404 Not Found
    const cross1 = await fetch(`${baseUrl}/notices/1`, {
      headers: { Authorization: `Bearer ${academy2Token}` },
    });
    console.log(`    Academy 2 -> GET /notices/1: status ${cross1.status} (expected 404)`);
    if (cross1.status !== 404) throw new Error(`Expected 404 for cross-tenant notice access, got ${cross1.status}`);

    // Endpoint 2: Student 1 (Academy 1) accessed by Academy 2 owner -> 404 Not Found
    const cross2 = await fetch(`${baseUrl}/students/1`, {
      headers: { Authorization: `Bearer ${academy2Token}` },
    });
    console.log(`    Academy 2 -> GET /students/1: status ${cross2.status} (expected 404)`);
    if (cross2.status !== 404) throw new Error(`Expected 404 for cross-tenant student access, got ${cross2.status}`);

    // Endpoint 3: Fees for Student 1 (Academy 1) accessed by Academy 2 owner -> 404 Not Found
    const cross3 = await fetch(`${baseUrl}/fees/student/1`, {
      headers: { Authorization: `Bearer ${academy2Token}` },
    });
    console.log(`    Academy 2 -> GET /fees/student/1: status ${cross3.status} (expected 404)`);
    if (cross3.status !== 404) throw new Error(`Expected 404 for cross-tenant fee access, got ${cross3.status}`);

    // =========================================================================
    // PART B: NOTICES MODULE (CRUD, PERMISSIONS, VALIDATIONS)
    // =========================================================================
    console.log("\n[4] Testing Notices Module CRUD & Permissions...");

    // 4.1 Validation: audience 'class' without classId fails (422)
    const invalidClassNotice = await fetch(`${baseUrl}/notices`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        title: "Invalid Notice Title",
        body: "Notice body without required classId",
        audience: "class",
      }),
    });
    console.log(`    POST /notices (class audience without classId): status ${invalidClassNotice.status} (expected 422)`);
    if (invalidClassNotice.status !== 422) throw new Error("Expected 422 for missing classId with class audience");

    // 4.2 Teacher attempts to publish 'all' audience notice -> 403 Forbidden
    const teacherBroadNotice = await fetch(`${baseUrl}/notices`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${teacherToken}`,
      },
      body: JSON.stringify({
        title: "Teacher Broadcast Attempt",
        body: "Broad notice not allowed for teacher",
        audience: "all",
      }),
    });
    console.log(`    Teacher -> POST /notices (audience 'all'): status ${teacherBroadNotice.status} (expected 403)`);
    if (teacherBroadNotice.status !== 403) throw new Error("Expected 403 when teacher posts audience 'all'");

    // 4.3 Teacher creates notice for their assigned Class 1 -> 201 Created
    const teacherValidNotice = await fetch(`${baseUrl}/notices`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${teacherToken}`,
      },
      body: JSON.stringify({
        title: "Class 9 Test Announcement",
        body: "Physics chapter 3 quiz will be conducted tomorrow.",
        audience: "class",
        classId: 1,
      }),
    });
    const teacherNoticeData = await teacherValidNotice.json();
    console.log(`    Teacher -> POST /notices (Class 1): status ${teacherValidNotice.status} (expected 201), NoticeID=${teacherNoticeData.data.id}`);
    if (teacherValidNotice.status !== 201) throw new Error("Teacher failed to create notice for assigned class");
    const createdNoticeId = teacherNoticeData.data.id;

    // 4.4 GET /notices with filters & read count
    const listNoticesRes = await fetch(`${baseUrl}/notices?audience=class&classId=1`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const listNoticesData = await listNoticesRes.json();
    console.log(`    GET /notices?audience=class&classId=1: status ${listNoticesRes.status}, count: ${listNoticesData.data.length}`);
    if (listNoticesRes.status !== 200) throw new Error("Failed to list notices");

    // 4.5 GET /notices/:id (detail with read count)
    const detailNoticeRes = await fetch(`${baseUrl}/notices/${createdNoticeId}`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const detailNoticeData = await detailNoticeRes.json();
    console.log(`    GET /notices/${createdNoticeId}: status ${detailNoticeRes.status}, readCount: ${detailNoticeData.data.readCount}`);
    if (detailNoticeRes.status !== 200) throw new Error("Failed to get notice detail");

    // 4.6 PATCH /notices/:id/pin (toggle pin)
    const pinRes = await fetch(`${baseUrl}/notices/${createdNoticeId}/pin`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const pinData = await pinRes.json();
    console.log(`    PATCH /notices/${createdNoticeId}/pin: status ${pinRes.status}, isPinned: ${pinData.data.isPinned}`);
    if (pinRes.status !== 200 || !pinData.data.isPinned) throw new Error("Failed to pin notice");

    // 4.7 PUT /notices/:id (edit notice)
    const editRes = await fetch(`${baseUrl}/notices/${createdNoticeId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        title: "Class 9 Test Announcement (UPDATED)",
        body: "Physics chapter 3 & 4 quiz will be conducted tomorrow.",
        audience: "class",
        classId: 1,
      }),
    });
    console.log(`    PUT /notices/${createdNoticeId}: status ${editRes.status}`);
    if (editRes.status !== 200) throw new Error("Failed to edit notice");

    // 4.8 DELETE /notices/:id
    const delNoticeRes = await fetch(`${baseUrl}/notices/${createdNoticeId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    console.log(`    DELETE /notices/${createdNoticeId}: status ${delNoticeRes.status}`);
    if (delNoticeRes.status !== 200) throw new Error("Failed to delete notice");

    // =========================================================================
    // PART C: SETTINGS MODULE & PLAN LIMITS
    // =========================================================================
    console.log("\n[5] Testing Settings Module & Plan Limits...");

    // 5.1 GET /settings
    const settingsRes = await fetch(`${baseUrl}/settings`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const settingsData = await settingsRes.json();
    console.log(`    GET /settings: status ${settingsRes.status}, Academy="${settingsData.data.profile.name}", Plan="${settingsData.data.plan.currentPlan}", Students=${settingsData.data.plan.currentStudents}/${settingsData.data.plan.maxStudents}`);
    if (settingsRes.status !== 200) throw new Error("Failed to fetch settings");

    // 5.2 PUT /settings/profile
    const updateProfRes = await fetch(`${baseUrl}/settings/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        name: "Bright Future Tuition Academy",
        city: "Lahore",
        phone: "0300-1234567",
        address: "Main Boulevard, Gulberg III, Lahore",
      }),
    });
    const updateProfData = await updateProfRes.json();
    console.log(`    PUT /settings/profile: status ${updateProfRes.status}, UpdatedName="${updateProfData.data.name}"`);
    if (updateProfRes.status !== 200) throw new Error("Failed to update profile");

    // 5.3 PUT /settings/fees (Invalid Placeholder -> 422)
    const invalidFeeSettings = await fetch(`${baseUrl}/settings/fees`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        feeDueDay: 10,
        lateFeeEnabled: true,
        lateFeeAmount: 200,
        reminderTemplate: "Fee of Rs {amount} for {student} is due on {dueDate}. Contact {unknownPlaceholder}.",
      }),
    });
    console.log(`    PUT /settings/fees (invalid variable {unknownPlaceholder}): status ${invalidFeeSettings.status} (expected 422)`);
    if (invalidFeeSettings.status !== 422) throw new Error("Expected 422 for invalid reminder template variable");

    // 5.4 PUT /settings/fees (Valid Placeholders -> 200)
    const validFeeSettings = await fetch(`${baseUrl}/settings/fees`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        feeDueDay: 10,
        lateFeeEnabled: true,
        lateFeeAmount: 250,
        reminderTemplate: "Dear Parent, fee of Rs {amount} for {student} is due on {dueDate}. Please clear for {month}. - {academy}",
      }),
    });
    console.log(`    PUT /settings/fees (valid variables): status ${validFeeSettings.status} (expected 200)`);
    if (validFeeSettings.status !== 200) throw new Error("Failed to update fee settings");

    // 5.5 PUT /settings/notifications
    const notifSettingsRes = await fetch(`${baseUrl}/settings/notifications`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        whatsappReminders: true,
        absentAlerts: true,
        weeklyReports: true,
      }),
    });
    console.log(`    PUT /settings/notifications: status ${notifSettingsRes.status}`);
    if (notifSettingsRes.status !== 200) throw new Error("Failed to update notification settings");

    // 5.6 Team Management: GET /settings/team
    const teamRes = await fetch(`${baseUrl}/settings/team`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const teamData = await teamRes.json();
    console.log(`    GET /settings/team: status ${teamRes.status}, team size: ${teamData.data.length}`);
    if (teamRes.status !== 200) throw new Error("Failed to fetch team");

    // 5.7 Team Management: POST /settings/team/invite
    const inviteEmail = `invited.teacher.${Date.now()}@demo.com`;
    const inviteRes = await fetch(`${baseUrl}/settings/team/invite`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        name: "Ayesha Khan",
        email: inviteEmail,
        phone: "0312-3456789",
        role: "teacher",
        subject: "Biology",
        qualification: "M.Sc Biology",
        salary: 40000,
      }),
    });
    const inviteData = await inviteRes.json();
    console.log(`    POST /settings/team/invite: status ${inviteRes.status} (expected 201), InvitedUser ID=${inviteData.data.user.id}, TempPass="${inviteData.data.temporaryPassword}"`);
    if (inviteRes.status !== 201) throw new Error("Failed to invite team member");
    const invitedUserId = inviteData.data.user.id;

    // 5.8 Critical Rule: Last owner can NEVER be demoted or removed
    const ownerUserId = ownerData.data.user.id;
    const demoteLastOwner = await fetch(`${baseUrl}/settings/team/${ownerUserId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({ role: "teacher" }),
    });
    console.log(`    PATCH /settings/team/${ownerUserId} (demote last owner): status ${demoteLastOwner.status} (expected 400)`);
    if (demoteLastOwner.status !== 400) throw new Error("Expected 400 when attempting to demote last owner");

    const deleteLastOwner = await fetch(`${baseUrl}/settings/team/${ownerUserId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    console.log(`    DELETE /settings/team/${ownerUserId} (delete last owner): status ${deleteLastOwner.status} (expected 400)`);
    if (deleteLastOwner.status !== 400) throw new Error("Expected 400 when attempting to delete last owner");

    // 5.9 Clean up invited test user
    const deleteInvited = await fetch(`${baseUrl}/settings/team/${invitedUserId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    console.log(`    DELETE /settings/team/${invitedUserId} (delete invited user): status ${deleteInvited.status} (expected 200)`);
    if (deleteInvited.status !== 200) throw new Error("Failed to delete invited user");

    // 5.10 GET /settings/plan
    const planRes = await fetch(`${baseUrl}/settings/plan`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const planData = await planRes.json();
    console.log(`    GET /settings/plan: status ${planRes.status}, Plan="${planData.data.currentPlan}", Students=${planData.data.currentStudents}/${planData.data.studentLimit}, LimitReached=${planData.data.isLimitReached}`);
    if (planRes.status !== 200) throw new Error("Failed to get plan details");

    // 5.11 Enforce Student Limit on Student Creation (free_pilot plan limit = 50 students)
    console.log("\n[6] Testing Subscription Plan Student Limit Enforcement...");
    // Temporarily ensure academy is on free_pilot to test the 50 student limit
    await query(`UPDATE academies SET plan = 'free_pilot' WHERE id = 1`);

    const limitTestStudent = await fetch(`${baseUrl}/students`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        classId: 1,
        name: "Limit Exceeded Test Student",
        fatherName: "Test Father",
        parentPhone: "0300-9998877",
        dateOfBirth: "2010-05-15",
        admissionDate: "2026-11-01",
      }),
    });
    const limitResult = await limitTestStudent.json();
    console.log(`    POST /students (when plan limit of 50 active students is reached): status ${limitTestStudent.status} (expected 402)`);
    console.log(`    402 Error Message: "${limitResult.message}"`);

    // Revert academy plan back
    await query(`UPDATE academies SET plan = 'standard' WHERE id = 1`);

    if (limitTestStudent.status !== 402) {
      throw new Error(`Expected 402 Payment Required for plan student limit, got ${limitTestStudent.status}`);
    }

    console.log("\n==================================================================");
    console.log("✅ ALL PARENT PORTAL, NOTICES & SETTINGS TESTS PASSED (100%)");
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
