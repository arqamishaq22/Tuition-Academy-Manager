# Academy Manager SaaS - Dashboard & Reports API Documentation

This document provides complete API reference, cURL examples, sample JSON/CSV responses, caching specifications, and SQL execution plans for the **Dashboard** (`/api/v1/dashboard`) and **Reports** (`/api/v1/reports`) modules.

---

## 1. Authentication & Role Permissions

All Dashboard and Reports routes require:
1. `Authorization: Bearer <access_token>` in the HTTP header.
2. Tenant isolation: every query automatically filters by `req.user.academyId`.
3. Strict RBAC: **Owner** and **Staff** only. Teachers (`403 Forbidden`) and Parents (`403 Forbidden`) are blocked.

---

## 2. In-Memory Caching Architecture

- **Target**: `GET /api/v1/dashboard/overview`
- **Mechanism**: In-memory `Map` cache with 60-second TTL per academy (`dashboard_overview_<academyId>`).
- **Cache Invalidation Triggers**:
  - Fee generation (`POST /api/v1/fees/generate`)
  - Fee payment collection / reversal (`POST /api/v1/fees/payments`, `POST /api/v1/fees/payments/:id/reverse`)
  - Fee adjustments (`PATCH /api/v1/fees/:id`)
  - Attendance marking & edits (`POST /api/v1/attendance/mark`, `PATCH /api/v1/attendance/:id`)
  - Student admission, update, & departure (`POST /api/v1/students`, `PUT /api/v1/students/:id`, `DELETE /api/v1/students/:id`)

---

## 3. Dashboard Endpoints (`/api/v1/dashboard`)

### 3.1. `GET /api/v1/dashboard/overview`
Returns high-level KPI cards for the tuition academy with month-over-month comparisons and today's operational status.

#### cURL
```bash
curl -X GET "http://localhost:5000/api/v1/dashboard/overview" \
  -H "Authorization: Bearer <OWNER_TOKEN>"
```

#### Sample JSON Response
```json
{
  "success": true,
  "data": {
    "students": {
      "totalActive": 50,
      "previousMonthActive": 40,
      "change": 10,
      "changePercent": 25.0,
      "direction": "up"
    },
    "attendance": {
      "todayAttendancePercent": 88.5,
      "classesScheduledToday": 5,
      "classesMarkedToday": 4,
      "classesNotMarkedToday": 1,
      "todayStats": {
        "present": 35,
        "late": 4,
        "absent": 5,
        "leave": 1
      }
    },
    "fees": {
      "feesCollectedThisMonth": 53200,
      "pendingFees": 72900,
      "overdueFees": 8000,
      "totalBilledThisMonth": 126100,
      "collectionPercent": 42.2,
      "changeVersusLastMonth": {
        "change": 14200,
        "changePercent": 36.4,
        "direction": "up",
        "previousMonthCollected": 39000
      }
    },
    "isCached": false
  }
}
```

---

### 3.2. `GET /api/v1/dashboard/fees-trend?months=6`
Returns monthly collection trend for the last $N$ months with zero-filling to guarantee gapless charting.

#### cURL
```bash
curl -X GET "http://localhost:5000/api/v1/dashboard/fees-trend?months=6" \
  -H "Authorization: Bearer <OWNER_TOKEN>"
```

#### Sample JSON Response
```json
{
  "success": true,
  "data": [
    { "month": "2026-06", "label": "Jun 2026", "collected": 0 },
    { "month": "2026-07", "label": "Jul 2026", "collected": 24000 },
    { "month": "2026-08", "label": "Aug 2026", "collected": 48000 },
    { "month": "2026-09", "label": "Sep 2026", "collected": 65000 },
    { "month": "2026-10", "label": "Oct 2026", "collected": 98500 },
    { "month": "2026-11", "label": "Nov 2026", "collected": 53200 }
  ]
}
```

---

### 3.3. `GET /api/v1/dashboard/fee-status?month=11&year=2026`
Aggregates fees into Paid, Pending, Partial, and Overdue for donut charts.

#### cURL
```bash
curl -X GET "http://localhost:5000/api/v1/dashboard/fee-status?month=11&year=2026" \
  -H "Authorization: Bearer <OWNER_TOKEN>"
```

#### Sample JSON Response
```json
{
  "success": true,
  "data": [
    { "status": "paid", "label": "Paid", "count": 22, "amount": 53200 },
    { "status": "pending", "label": "Pending", "count": 18, "amount": 45000 },
    { "status": "partial", "label": "Partial", "count": 5, "amount": 12000 },
    { "status": "overdue", "label": "Overdue", "count": 5, "amount": 15900 }
  ]
}
```

---

### 3.4. `GET /api/v1/dashboard/attendance-weekly`
Attendance percentage for Monday to Saturday of the current week (Asia/Karachi).

#### cURL
```bash
curl -X GET "http://localhost:5000/api/v1/dashboard/attendance-weekly" \
  -H "Authorization: Bearer <OWNER_TOKEN>"
```

#### Sample JSON Response
```json
{
  "success": true,
  "data": [
    { "day": "Mon", "date": "2026-11-09", "percentage": 92.5, "present": 42, "absent": 3, "late": 2, "leave": 1, "total": 48 },
    { "day": "Tue", "date": "2026-11-10", "percentage": 88.0, "present": 40, "absent": 5, "late": 2, "leave": 0, "total": 47 },
    { "day": "Wed", "date": "2026-11-11", "percentage": 0.0, "present": 0, "absent": 0, "late": 0, "leave": 0, "total": 0 },
    { "day": "Thu", "date": "2026-11-12", "percentage": 0.0, "present": 0, "absent": 0, "late": 0, "leave": 0, "total": 0 },
    { "day": "Fri", "date": "2026-11-13", "percentage": 0.0, "present": 0, "absent": 0, "late": 0, "leave": 0, "total": 0 },
    { "day": "Sat", "date": "2026-11-14", "percentage": 0.0, "present": 0, "absent": 0, "late": 0, "leave": 0, "total": 0 }
  ]
}
```

---

### 3.5. `GET /api/v1/dashboard/fees-due?days=7`
Lists up to 10 students whose fees are due within $N$ days or are overdue, with guardian phone numbers for SMS/WhatsApp follow-ups.

#### cURL
```bash
curl -X GET "http://localhost:5000/api/v1/dashboard/fees-due?days=7" \
  -H "Authorization: Bearer <OWNER_TOKEN>"
```

#### Sample JSON Response
```json
{
  "success": true,
  "data": [
    {
      "feeId": 12,
      "studentId": 45,
      "studentName": "Maya Ali",
      "rollNo": "10-004",
      "className": "Class 10",
      "parentPhone": "03001234567",
      "month": 10,
      "monthName": "October",
      "year": 2026,
      "amount": 3500,
      "lateFee": 500,
      "paidAmount": 3000,
      "balance": 1000,
      "dueDate": "2026-10-10",
      "isOverdue": true,
      "daysOverdue": 31
    }
  ]
}
```

---

### 3.6. `GET /api/v1/dashboard/recent-activity?limit=10`
Returns latest administrative audit logs converted to human-readable sentences.

#### cURL
```bash
curl -X GET "http://localhost:5000/api/v1/dashboard/recent-activity?limit=5" \
  -H "Authorization: Bearer <OWNER_TOKEN>"
```

#### Sample JSON Response
```json
{
  "success": true,
  "data": [
    {
      "id": 142,
      "action": "PAYMENT_RECEIVED",
      "entity": "fee_payment",
      "entityId": 89,
      "text": "Ali Raza paid Rs 3,000 for October fee (Cash)",
      "userName": "Admin User",
      "createdAt": "2026-11-10T09:15:00.000Z"
    },
    {
      "id": 141,
      "action": "ATTENDANCE_MARKED",
      "entity": "attendance",
      "entityId": 4,
      "text": "Marked attendance for Class 9 (25 students)",
      "userName": "Sir Hamza Tariq",
      "createdAt": "2026-11-10T08:30:00.000Z"
    }
  ]
}
```

---

### 3.7. `GET /api/v1/dashboard/top-classes`
Ranks active classes by attendance rate for the current month with assigned class teacher.

#### cURL
```bash
curl -X GET "http://localhost:5000/api/v1/dashboard/top-classes" \
  -H "Authorization: Bearer <OWNER_TOKEN>"
```

#### Sample JSON Response
```json
{
  "success": true,
  "data": [
    {
      "classId": 3,
      "className": "Class 6",
      "classSection": "A",
      "teacherName": "Sir Hamza Tariq",
      "totalStudents": 10,
      "attendanceRate": 100.0
    },
    {
      "classId": 1,
      "className": "Class 9",
      "classSection": "Pre-Engineering",
      "teacherName": "Sir Hamza Tariq",
      "totalStudents": 12,
      "attendanceRate": 91.2
    }
  ]
}
```

---

## 4. Reports Endpoints (`/api/v1/reports`)

All reports support `?format=json` (default) and `?format=csv` (RFC 4180 streaming attachment).

### 4.1. `GET /api/v1/reports/fee-collection`
- **Filters**: `from=YYYY-MM-DD`, `to=YYYY-MM-DD`, `classId=INT`, `groupBy=day|month`, `format=json|csv`
- **CSV Content**: Columns `Period`, `Cash (PKR)`, `JazzCash (PKR)`, `EasyPaisa (PKR)`, `Bank Transfer (PKR)`, `Total Collected (PKR)`, `Transactions Count`.

### 4.2. `GET /api/v1/reports/outstanding`
- **Filters**: `classId=INT`, `format=json|csv`
- **CSV Content**: Columns `Class`, `Roll No`, `Student Name`, `Father Name`, `Parent Phone`, `Unpaid Months Count`, `Total Outstanding (PKR)`.

### 4.3. `GET /api/v1/reports/attendance-summary`
- **Filters**: `month=1-12`, `year=YYYY`, `classId=INT`, `format=json|csv`
- **CSV Content**: Columns `Roll No`, `Student Name`, `Class`, `Parent Phone`, `Present`, `Late`, `Absent`, `Leave`, `Attendance %`, `Low Attendance Alert`.

### 4.4. `GET /api/v1/reports/student-strength`
- **Filters**: `format=json|csv`
- **CSV Content**: Columns `Class`, `Active Students`, `Active Males`, `Active Females`, `Inactive Students`, `Left Students`, `Total Registered`.

### 4.5. `GET /api/v1/reports/income-vs-teacher-salary`
- **Filters**: `year=YYYY`, `format=json|csv`
- **CSV Content**: Columns `Month`, `Fee Income (PKR)`, `Teacher Salaries (PKR)`, `Net Profit / Loss (PKR)`, `Profit Margin %`.

### 4.6. `GET /api/v1/reports/class-performance`
- **Filters**: `examId=INT` (required or default latest), `classId=INT`, `format=json|csv`
- **CSV Content**: Columns `Subject`, `Total Marks`, `Passing Marks`, `Evaluated Students`, `Average Marks`, `Average %`, `Highest Marks`, `Lowest Marks`, `Passed Count`, `Failed Count`, `Pass Rate %`.

---

## 5. SQL Performance & EXPLAIN Execution Plans

Composite indexes deployed:
- `payments`: `(academy_id, paid_on)`
- `attendance`: `(academy_id, date)`
- `fees`: `(academy_id, due_date)`
- `activity_logs`: `(academy_id, created_at)`

### EXPLAIN 1: Payments Date-Range Aggregation
```sql
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
GROUP BY period, p.method;
```
- **Type**: `range` scan using `idx_payments_academy_paid_on`. Avoids scanning historical years.

### EXPLAIN 2: Fees Due / Overdue Lookup
```sql
EXPLAIN
SELECT f.id, f.amount, f.due_date, s.name, c.name
FROM fees f
JOIN students s ON f.student_id = s.id
JOIN classes c ON s.class_id = c.id
WHERE f.academy_id = 1
  AND s.deleted_at IS NULL
  AND (f.amount + f.late_fee) > f.paid_amount
  AND f.due_date <= DATE_ADD(CURRENT_DATE(), INTERVAL 7 DAY)
ORDER BY f.due_date ASC
LIMIT 10;
```
- **Type**: `ref` and `range` using `idx_fees_academy_due_date` and `PRIMARY` key joins on `students` and `classes`.

### EXPLAIN 3: Weekly Attendance Grouping
```sql
EXPLAIN
SELECT date, status, COUNT(*) AS count
FROM attendance
WHERE academy_id = 1
  AND date >= '2026-11-09'
  AND date <= '2026-11-14'
GROUP BY date, status;
```
- **Type**: `range` scan using `idx_attendance_date` / `idx_attendance_academy_date`.

