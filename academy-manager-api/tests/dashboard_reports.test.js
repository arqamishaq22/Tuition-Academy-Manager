import app from "../src/app.js";
import { pool, testConnection, query } from "../src/config/db.js";
import { clearDashboardCache } from "../src/utils/cache.js";

async function runTests() {
  console.log("============================================================");
  console.log("🧪 RUNNING COMPREHENSIVE TESTS: DASHBOARD & REPORTS MODULES");
  console.log("============================================================");

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

    // 1. Owner Login
    const ownerRes = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "owner@demo.com", password: "Demo@1234" }),
    });
    const ownerData = await ownerRes.json();
    const ownerToken = ownerData.data?.accessToken;
    const academyId = ownerData.data?.academy?.id || 1;
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
    // 1. ACCESS CONTROL TESTS (Owner & Staff ONLY)
    // -------------------------------------------------------------
    console.log("\n[1] Testing Access Control & RBAC Permissions...");

    // 1.1 Unauthenticated dashboard access
    const unauthRes = await fetch(`${baseUrl}/dashboard/overview`);
    console.log(`    Unauthenticated /dashboard/overview: status ${unauthRes.status} (expected 401)`);
    if (unauthRes.status !== 401) throw new Error("Expected 401 for unauthenticated request");

    // 1.2 Teacher dashboard access (Teacher forbidden)
    const teacherDashRes = await fetch(`${baseUrl}/dashboard/overview`, {
      headers: { Authorization: `Bearer ${teacherToken}` },
    });
    console.log(`    Teacher /dashboard/overview: status ${teacherDashRes.status} (expected 403)`);
    if (teacherDashRes.status !== 403) throw new Error("Expected 403 for teacher accessing dashboard");

    // 1.3 Parent reports access (Parent forbidden)
    const parentReportRes = await fetch(`${baseUrl}/reports/fee-collection`, {
      headers: { Authorization: `Bearer ${parentToken}` },
    });
    console.log(`    Parent /reports/fee-collection: status ${parentReportRes.status} (expected 403)`);
    if (parentReportRes.status !== 403) throw new Error("Expected 403 for parent accessing reports");

    // 1.4 Owner dashboard access (Allowed)
    const ownerOverviewRes = await fetch(`${baseUrl}/dashboard/overview`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    console.log(`    Owner /dashboard/overview: status ${ownerOverviewRes.status} (expected 200)`);
    if (ownerOverviewRes.status !== 200) throw new Error("Expected 200 for owner accessing dashboard");

    // -------------------------------------------------------------
    // 2. DASHBOARD ENDPOINTS & CACHING
    // -------------------------------------------------------------
    console.log("\n[2] Testing Dashboard Analytics Endpoints & Caching...");

    // Invalidate cache first to test fresh compute
    clearDashboardCache(academyId);

    // 2.1 GET /dashboard/overview (Fresh compute: isCached = false)
    const freshOverviewRes = await fetch(`${baseUrl}/dashboard/overview`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const freshOverview = await freshOverviewRes.json();
    console.log(`    Overview (1st call): isCached = ${freshOverview.data.isCached} (expected false)`);
    if (freshOverview.data.isCached !== false) throw new Error("Expected first overview call to not be cached");

    // Verify Overview Schema
    const ov = freshOverview.data;
    console.log(`    Overview Students: Active=${ov.students.totalActive}, PrevMonth=${ov.students.previousMonthActive}, Change=${ov.students.change} (${ov.students.direction})`);
    console.log(`    Overview Attendance: Today%=${ov.attendance.todayAttendancePercent}%, UnmarkedClasses=${ov.attendance.classesNotMarkedToday}`);
    console.log(`    Overview Fees: Collected=${ov.fees.feesCollectedThisMonth} PKR, Pending=${ov.fees.pendingFees} PKR, Overdue=${ov.fees.overdueFees} PKR, Rate=${ov.fees.collectionPercent}%`);
    if (typeof ov.students.totalActive !== "number" || typeof ov.fees.feesCollectedThisMonth !== "number") {
      throw new Error("Invalid overview payload shape");
    }

    // 2.2 GET /dashboard/overview (2nd call: isCached = true)
    const cachedOverviewRes = await fetch(`${baseUrl}/dashboard/overview`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const cachedOverview = await cachedOverviewRes.json();
    console.log(`    Overview (2nd call within 60s): isCached = ${cachedOverview.data.isCached} (expected true)`);
    if (cachedOverview.data.isCached !== true) throw new Error("Expected second overview call to return cached data");

    // 2.3 Cache Invalidation test
    clearDashboardCache(academyId);
    const postInvalidateRes = await fetch(`${baseUrl}/dashboard/overview`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const postInvalidate = await postInvalidateRes.json();
    console.log(`    Overview (after invalidation): isCached = ${postInvalidate.data.isCached} (expected false)`);
    if (postInvalidate.data.isCached !== false) throw new Error("Expected cache invalidation to work");

    // 2.4 GET /dashboard/fees-trend?months=6
    const trendRes = await fetch(`${baseUrl}/dashboard/fees-trend?months=6`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const trendData = await trendRes.json();
    console.log(`    Fees Trend (6 months): status ${trendRes.status}, items: ${trendData.data.length}`);
    if (trendData.data.length !== 6) throw new Error(`Expected exactly 6 months in trend, got ${trendData.data.length}`);
    for (const item of trendData.data) {
      if (typeof item.collected !== "number" || !item.month || !item.label) {
        throw new Error("Invalid trend item shape");
      }
    }
    console.log(`    Trend Sample: Month=${trendData.data[0].month} (${trendData.data[0].label}), Collected=${trendData.data[0].collected} PKR`);

    // 2.5 GET /dashboard/fee-status?month=10&year=2026
    const feeStatusRes = await fetch(`${baseUrl}/dashboard/fee-status?month=10&year=2026`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const feeStatusData = await feeStatusRes.json();
    console.log(`    Fee Status: status ${feeStatusRes.status}, slices: ${feeStatusData.data.length}`);
    const statusMap = Object.fromEntries(feeStatusData.data.map((s) => [s.status, s]));
    console.log(`    Paid: count=${statusMap.paid.count}, amt=${statusMap.paid.amount}`);
    console.log(`    Pending: count=${statusMap.pending.count}, amt=${statusMap.pending.amount}`);
    console.log(`    Partial: count=${statusMap.partial.count}, amt=${statusMap.partial.amount}`);
    console.log(`    Overdue: count=${statusMap.overdue.count}, amt=${statusMap.overdue.amount}`);

    // 2.6 GET /dashboard/attendance-weekly
    const weeklyRes = await fetch(`${baseUrl}/dashboard/attendance-weekly`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const weeklyData = await weeklyRes.json();
    console.log(`    Attendance Weekly: status ${weeklyRes.status}, days count: ${weeklyData.data.length}`);
    if (weeklyData.data.length !== 6) throw new Error(`Expected 6 days (Mon-Sat), got ${weeklyData.data.length}`);
    console.log(`    First day: ${weeklyData.data[0].day} (${weeklyData.data[0].date}) - Rate: ${weeklyData.data[0].percentage}%`);

    // 2.7 GET /dashboard/fees-due?days=7
    const feesDueRes = await fetch(`${baseUrl}/dashboard/fees-due?days=7`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const feesDueData = await feesDueRes.json();
    console.log(`    Fees Due (7 days): status ${feesDueRes.status}, records: ${feesDueData.data.length}`);
    if (feesDueData.data.length > 0) {
      const topDue = feesDueData.data[0];
      console.log(`    Top Due Student: ${topDue.studentName} (${topDue.className}) - Balance: ${topDue.balance} PKR, Due: ${topDue.dueDate}, Overdue: ${topDue.isOverdue}`);
    }

    // 2.8 GET /dashboard/recent-activity?limit=5
    const activityRes = await fetch(`${baseUrl}/dashboard/recent-activity?limit=5`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const activityData = await activityRes.json();
    console.log(`    Recent Activity: status ${activityRes.status}, logs count: ${activityData.data.length}`);
    if (activityData.data.length > 0) {
      console.log(`    Latest Activity Text: "${activityData.data[0].text}" by ${activityData.data[0].userName}`);
    }

    // 2.9 GET /dashboard/top-classes
    const topClassesRes = await fetch(`${baseUrl}/dashboard/top-classes`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const topClassesData = await topClassesRes.json();
    console.log(`    Top Classes: status ${topClassesRes.status}, count: ${topClassesData.data.length}`);
    if (topClassesData.data.length > 0) {
      console.log(`    #1 Class: ${topClassesData.data[0].className} (Teacher: ${topClassesData.data[0].teacherName}) - Rate: ${topClassesData.data[0].attendanceRate}%`);
    }

    // -------------------------------------------------------------
    // 3. REPORTS ENDPOINTS (JSON & CSV EXPORT)
    // -------------------------------------------------------------
    console.log("\n[3] Testing Reports Endpoints in JSON and CSV Formats...");

    // 3.1 Fee Collection Report
    // JSON
    const feeCollJsonRes = await fetch(`${baseUrl}/reports/fee-collection?groupBy=month&format=json`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const feeCollJson = await feeCollJsonRes.json();
    console.log(`    Fee Collection Report (JSON): status ${feeCollJsonRes.status}, grandTotal: ${feeCollJson.data.grandTotal} PKR, transactions: ${feeCollJson.data.totalTransactions}`);

    // CSV
    const feeCollCsvRes = await fetch(`${baseUrl}/reports/fee-collection?groupBy=month&format=csv`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const feeCollCsvText = await feeCollCsvRes.text();
    const feeCollContentType = feeCollCsvRes.headers.get("content-type");
    console.log(`    Fee Collection Report (CSV): status ${feeCollCsvRes.status}, Content-Type: ${feeCollContentType}`);
    if (!feeCollContentType.includes("text/csv")) throw new Error("Expected text/csv content type");
    if (!feeCollCsvText.startsWith("Period,Cash (PKR),JazzCash (PKR)")) throw new Error("Invalid CSV header");

    // 3.2 Outstanding Fees Report
    // JSON
    const outstandingJsonRes = await fetch(`${baseUrl}/reports/outstanding?format=json`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const outstandingJson = await outstandingJsonRes.json();
    console.log(`    Outstanding Report (JSON): status ${outstandingJsonRes.status}, grandTotalOutstanding: ${outstandingJson.data.grandTotalOutstanding} PKR across ${outstandingJson.data.totalStudentsWithDues} students`);

    // CSV
    const outstandingCsvRes = await fetch(`${baseUrl}/reports/outstanding?format=csv`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const outstandingCsvText = await outstandingCsvRes.text();
    console.log(`    Outstanding Report (CSV): status ${outstandingCsvRes.status}, size: ${outstandingCsvText.length} chars`);
    if (!outstandingCsvText.startsWith("Class,Roll No,Student Name")) throw new Error("Invalid CSV header for outstanding");

    // 3.3 Attendance Summary Report
    // JSON
    const attSummaryJsonRes = await fetch(`${baseUrl}/reports/attendance-summary?format=json`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const attSummaryJson = await attSummaryJsonRes.json();
    console.log(`    Attendance Summary (JSON): status ${attSummaryJsonRes.status}, classes: ${attSummaryJson.data.classes.length}, lowAttendanceCount: ${attSummaryJson.data.lowAttendanceStudents.length}`);

    // CSV
    const attSummaryCsvRes = await fetch(`${baseUrl}/reports/attendance-summary?format=csv`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const attSummaryCsvText = await attSummaryCsvRes.text();
    console.log(`    Attendance Summary (CSV): status ${attSummaryCsvRes.status}, size: ${attSummaryCsvText.length} chars`);
    if (!attSummaryCsvText.startsWith("Roll No,Student Name,Class")) throw new Error("Invalid CSV header for attendance summary");

    // 3.4 Student Strength Report
    // JSON
    const strengthJsonRes = await fetch(`${baseUrl}/reports/student-strength?format=json`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const strengthJson = await strengthJsonRes.json();
    console.log(`    Student Strength (JSON): status ${strengthJsonRes.status}, totalActive: ${strengthJson.data.summary.totalActiveStudents}, 12m flow months: ${strengthJson.data.monthlyFlow.length}`);

    // CSV
    const strengthCsvRes = await fetch(`${baseUrl}/reports/student-strength?format=csv`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const strengthCsvText = await strengthCsvRes.text();
    console.log(`    Student Strength (CSV): status ${strengthCsvRes.status}, size: ${strengthCsvText.length} chars`);
    if (!strengthCsvText.startsWith("Class,Active Students,Active Males")) throw new Error("Invalid CSV header for student strength");

    // 3.5 Income vs Teacher Salary Report (Profit Analysis)
    // JSON
    const incomeSalaryJsonRes = await fetch(`${baseUrl}/reports/income-vs-teacher-salary?year=2026&format=json`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const incomeSalaryJson = await incomeSalaryJsonRes.json();
    const ann = incomeSalaryJson.data.annualSummary;
    console.log(`    Income vs Salary (JSON): status ${incomeSalaryJsonRes.status}, Income=${ann.annualIncome} PKR, Salaries=${ann.annualSalaries} PKR, NetMargin=${ann.annualNetProfit} PKR, Margin%=${ann.annualMarginPercent}%`);

    // CSV
    const incomeSalaryCsvRes = await fetch(`${baseUrl}/reports/income-vs-teacher-salary?year=2026&format=csv`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const incomeSalaryCsvText = await incomeSalaryCsvRes.text();
    console.log(`    Income vs Salary (CSV): status ${incomeSalaryCsvRes.status}, size: ${incomeSalaryCsvText.length} chars`);
    if (!incomeSalaryCsvText.startsWith("Month,Fee Income (PKR),Teacher Salaries (PKR)")) throw new Error("Invalid CSV header for income vs salary");

    // 3.6 Class Performance Report
    // JSON
    const perfJsonRes = await fetch(`${baseUrl}/reports/class-performance?examId=1&format=json`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const perfJson = await perfJsonRes.json();
    console.log(`    Class Performance (JSON): status ${perfJsonRes.status}, Exam: "${perfJson.data.exam.name}", Class: ${perfJson.data.exam.className}, Subjects: ${perfJson.data.subjects.length}`);

    // CSV
    const perfCsvRes = await fetch(`${baseUrl}/reports/class-performance?examId=1&format=csv`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const perfCsvText = await perfCsvRes.text();
    console.log(`    Class Performance (CSV): status ${perfCsvRes.status}, size: ${perfCsvText.length} chars`);
    if (!perfCsvText.startsWith("Subject,Total Marks,Passing Marks")) throw new Error("Invalid CSV header for class performance");

    // -------------------------------------------------------------
    // 4. SQL QUERY PLAN ANALYSIS (EXPLAIN ON 3 HEAVIEST QUERIES)
    // -------------------------------------------------------------
    console.log("\n[4] EXPLAIN Plans on Heaviest Analytical Queries...");

    // Query 1: Payments date-range aggregation (Fee Collection & Trend)
    console.log("\n--- EXPLAIN 1: Payments Date Range Aggregation (idx_payments_academy_paid_on) ---");
    const explain1 = await query(`
      EXPLAIN
      SELECT 
        DATE_FORMAT(p.paid_on, '%Y-%m') AS period,
        p.method,
        COALESCE(SUM(p.amount), 0) AS total_amount,
        COUNT(p.id) AS payment_count
      FROM payments p
      JOIN students s ON p.student_id = s.id
      WHERE p.academy_id = 1
        AND p.paid_on >= '2026-01-01'
        AND p.paid_on <= '2026-12-31'
      GROUP BY period, p.method
    `);
    console.table(explain1);

    // Query 2: Fees Due / Overdue Aggregation (idx_fees_academy_due_date)
    console.log("\n--- EXPLAIN 2: Fees Due & Overdue Lookup (idx_fees_academy_due_date) ---");
    const explain2 = await query(`
      EXPLAIN
      SELECT 
        f.id AS fee_id,
        f.month,
        f.year,
        f.amount,
        f.late_fee,
        f.paid_amount,
        (f.amount + f.late_fee - f.paid_amount) AS balance,
        f.due_date,
        s.id AS student_id,
        s.name AS student_name,
        c.name AS class_name
      FROM fees f
      JOIN students s ON f.student_id = s.id
      JOIN classes c ON s.class_id = c.id
      WHERE f.academy_id = 1
        AND s.deleted_at IS NULL
        AND (f.amount + f.late_fee) > f.paid_amount
        AND f.due_date <= DATE_ADD(CURRENT_DATE(), INTERVAL 7 DAY)
      ORDER BY f.due_date ASC
      LIMIT 10
    `);
    console.table(explain2);

    // Query 3: Attendance Weekly Status Aggregation (idx_attendance_academy_date)
    console.log("\n--- EXPLAIN 3: Weekly Attendance Grouping (idx_attendance_academy_date) ---");
    const explain3 = await query(`
      EXPLAIN
      SELECT 
        date,
        status,
        COUNT(*) AS count
      FROM attendance
      WHERE academy_id = 1
        AND date >= '2026-11-09'
        AND date <= '2026-11-14'
      GROUP BY date, status
    `);
    console.table(explain3);

    console.log("\n============================================================");
    console.log("✅ ALL DASHBOARD AND REPORTS TESTS PASSED SUCCESSFULLY (100%)");
    console.log("============================================================");
  } finally {
    server.close();
    await pool.end();
  }
}

runTests().catch((err) => {
  console.error("❌ Test suite failed:", err);
  process.exit(1);
});
