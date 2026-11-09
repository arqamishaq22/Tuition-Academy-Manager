# Academy Manager API — Attendance Module Reference 📋

Base URL: `http://localhost:5000/api/v1/attendance`

All requests require authentication with an access token in the header:
```http
Authorization: Bearer <accessToken>
```

---

## 🔒 Access Rules
- **Owner & Staff**: Full access to all attendance actions (read, mark, update, reports, absentees).
- **Teacher**: Can mark and view attendance **only for classes assigned to them**. Cannot edit individual records (`PATCH /:id` is blocked with 403 Forbidden).
- **Parent**: Blocked from all attendance management routes (HTTP 403 Forbidden).

---

## 📐 Business Rules & Formulas

1. **Attendance Percentage Formula**:
   $$\text{Attendance Percentage} = \frac{\text{present} + \text{late}}{\text{present} + \text{late} + \text{absent}} \times 100$$
   - *Note*: **Leave** days are explicitly excluded from the denominator.
   - Standardized in `src/utils/attendance.js`: `calculateAttendancePercentage(present, late, absent)`.

2. **Sunday Restriction**:
   - Marking attendance on a Sunday is rejected with HTTP 400 unless the class's `days_of_week` schedule explicitly contains `Sun`.

3. **Admission Date Restriction**:
   - Attendance cannot be marked or counted for dates prior to a student's `admission_date`.

4. **Future Date Restriction**:
   - Marking attendance for future dates (relative to Asia/Karachi today) is rejected with HTTP 400.

---

## 🚀 Endpoints & Curl Examples

### 1. `GET /class/:classId?date=YYYY-MM-DD` (Daily Class Roster & Stats)
Returns the roster of active students for that class on that date with their status (`null` if not marked yet) and overall summary counts.

```bash
curl -X GET "http://localhost:5000/api/v1/attendance/class/1?date=2026-11-02" \
  -H "Authorization: Bearer <accessToken>"
```

**Real Output (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "class": {
      "id": 1,
      "name": "Class 6"
    },
    "date": "2026-11-02",
    "isSunday": false,
    "summary": {
      "present": 7,
      "absent": 0,
      "late": 0,
      "leave": 1,
      "notMarked": 0,
      "total": 8,
      "attendancePercentage": 100
    },
    "students": [
      {
        "student_id": 1,
        "roll_no": "601",
        "student_name": "Muhammad Ali",
        "father_name": "Tariq Mehmood",
        "gender": "male",
        "status": "present",
        "note": null,
        "marked_at": "2026-11-02 15:10:00"
      }
    ]
  }
}
```

---

### 2. `POST /mark` (Bulk Save & Upsert)
Saves or updates daily attendance for a batch of students. Uses `INSERT ... ON DUPLICATE KEY UPDATE` so submitting again updates without error.

```bash
curl -X POST "http://localhost:5000/api/v1/attendance/mark" \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "classId": 1,
    "date": "2026-11-06",
    "records": [
      { "studentId": 1, "status": "present", "note": "On time" },
      { "studentId": 2, "status": "late", "note": "15 min traffic" },
      { "studentId": 3, "status": "absent", "note": "No response" },
      { "studentId": 4, "status": "leave", "note": "Medical application" }
    ]
  }'
```

**Real Output (`201 Created`)**:
```json
{
  "success": true,
  "data": {
    "class": {
      "id": 1,
      "name": "Class 6"
    },
    "date": "2026-11-06",
    "isSunday": false,
    "summary": {
      "present": 1,
      "absent": 1,
      "late": 1,
      "leave": 1,
      "notMarked": 4,
      "total": 8,
      "attendancePercentage": 66.7
    }
  }
}
```

---

### 3. `PATCH /:id` (Edit One Record)
Owner or staff only. Updates status or note with an audit trail in `activity_logs`.

```bash
curl -X PATCH "http://localhost:5000/api/v1/attendance/1" \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "leave",
    "note": "Approved by Principal"
  }'
```

**Real Output (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "studentId": 1,
    "studentName": "Muhammad Ali",
    "classId": 1,
    "className": "Class 6",
    "date": "2026-11-02",
    "status": "leave",
    "note": "Approved by Principal",
    "updatedAt": "2026-11-09T08:41:32.480Z"
  }
}
```

---

### 4. `GET /history?classId=&month=&year=` (Monthly Heatmap & Percentages)
Returns the daily attendance percentage for each day marked in the month for a class, plus summary metrics (`averagePercent`, `bestDay`, `lowestDay`).

```bash
curl -X GET "http://localhost:5000/api/v1/attendance/history?classId=1&month=11&year=2026" \
  -H "Authorization: Bearer <accessToken>"
```

**Real Output (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "classId": 1,
    "month": 11,
    "year": 2026,
    "summary": {
      "daysMarked": 4,
      "averagePercent": 100,
      "bestDay": {
        "date": "2026-11-02",
        "percent": 100
      },
      "lowestDay": {
        "date": "2026-11-02",
        "percent": 100
      }
    },
    "daily": [
      {
        "date": "2026-11-02",
        "present": 7,
        "late": 0,
        "absent": 0,
        "leave": 1,
        "totalMarked": 8,
        "percentage": 100
      }
    ]
  }
}
```

---

### 5. `GET /history/day?classId=&date=`
Returns the list of students with their status and note for that specific day.

```bash
curl -X GET "http://localhost:5000/api/v1/attendance/history/day?classId=1&date=2026-11-02" \
  -H "Authorization: Bearer <accessToken>"
```

---

### 6. `GET /student/:studentId?month=&year=` (Student Calendar & Totals)
Calendar data (date and status per day) and totals for one student, plus overall percentage.

```bash
curl -X GET "http://localhost:5000/api/v1/attendance/student/1?month=11&year=2026" \
  -H "Authorization: Bearer <accessToken>"
```

**Real Output (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "student": {
      "id": 1,
      "name": "Muhammad Ali",
      "rollNo": "601",
      "classId": 1,
      "className": "Class 6",
      "admissionDate": "2025-04-01"
    },
    "month": 11,
    "year": 2026,
    "totals": {
      "present": 4,
      "absent": 0,
      "late": 0,
      "leave": 0,
      "totalMarked": 4
    },
    "overallPercentage": 100,
    "records": [
      {
        "date": "2026-11-02",
        "status": "present",
        "note": null
      }
    ]
  }
}
```

---

### 7. `GET /report/monthly?classId=&month=&year=` (Ledger with <75% Low Attendance Flag)
Table of students with present, absent, late, leave counts and attendance percentage. Automatically flags students below 75% with `lowAttendance: true`.

```bash
curl -X GET "http://localhost:5000/api/v1/attendance/report/monthly?classId=1&month=11&year=2026" \
  -H "Authorization: Bearer <accessToken>"
```

**Real Output (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "class": {
      "id": 1,
      "name": "Class 6"
    },
    "month": 11,
    "year": 2026,
    "summary": {
      "totalStudents": 8,
      "averagePercentage": 100,
      "lowAttendanceCount": 0
    },
    "students": [
      {
        "studentId": 1,
        "rollNo": "601",
        "name": "Muhammad Ali",
        "fatherName": "Tariq Mehmood",
        "gender": "male",
        "parentPhone": "0300-1110001",
        "present": 4,
        "absent": 0,
        "late": 0,
        "leave": 0,
        "attendancePercentage": 100,
        "lowAttendance": false
      }
    ]
  }
}
```

---

### 8. `GET /absentees?date=` (Parent Notification Ledger)
List of absent students with parent phone numbers for WhatsApp/SMS notifications.

```bash
curl -X GET "http://localhost:5000/api/v1/attendance/absentees?date=2026-11-06" \
  -H "Authorization: Bearer <accessToken>"
```

**Real Output (`200 OK`)**:
```json
{
  "success": true,
  "data": [
    {
      "attendance_id": 41,
      "date": "2026-11-06",
      "note": "No call from parents",
      "student_id": 3,
      "roll_no": "603",
      "student_name": "Bilal Ahmed",
      "father_name": "Abdul Rehman",
      "parent_phone": "0300-1110003",
      "class_id": 1,
      "class_name": "Class 6"
    }
  ]
}
```

---

### 9. `GET /report/monthly/export?classId=&month=&year=` (CSV Download)
Streams the monthly report as a CSV attachment.

```bash
curl -X GET "http://localhost:5000/api/v1/attendance/report/monthly/export?classId=1&month=11&year=2026" \
  -H "Authorization: Bearer <accessToken>" \
  -o class1_nov2026_attendance.csv
```

---

## ⚡ Performance & EXPLAIN Analysis

### Query 1: Class Monthly History Aggregation
```sql
EXPLAIN SELECT 
  date,
  COUNT(*) AS total_marked,
  SUM(status = 'present') AS present_count,
  SUM(status = 'absent') AS absent_count,
  SUM(status = 'late') AS late_count,
  SUM(status = 'leave') AS leave_count
FROM attendance
WHERE academy_id = 1 
  AND class_id = 1 
  AND date >= '2026-11-01' AND date <= '2026-11-30'
GROUP BY date
ORDER BY date ASC;
```

**Plan Details**:
- **Index Used**: `idx_attendance_class_date`
- **Access Type**: `range`
- **Key Length**: `11` (`class_id` [8 bytes] + `date` [3 bytes])
- **Rows Examined**: `24` rows (targeted range scan, zero table scan)
- **Extra**: `Using index condition; Using where`

---

### Query 2: Monthly Class Student Ledger Report
```sql
EXPLAIN SELECT 
  s.id AS student_id,
  s.roll_no,
  s.name AS student_name,
  s.father_name,
  s.gender,
  s.parent_phone,
  s.admission_date,
  COALESCE(att.present_count, 0) AS present_count,
  COALESCE(att.absent_count, 0) AS absent_count,
  COALESCE(att.late_count, 0) AS late_count,
  COALESCE(att.leave_count, 0) AS leave_count
FROM students s
LEFT JOIN (
  SELECT 
    a.student_id,
    SUM(a.status = 'present') AS present_count,
    SUM(a.status = 'absent') AS absent_count,
    SUM(a.status = 'late') AS late_count,
    SUM(a.status = 'leave') AS leave_count
  FROM attendance a
  WHERE a.academy_id = 1 
    AND a.class_id = 1 
    AND a.date >= '2026-11-01' AND a.date <= '2026-11-30'
  GROUP BY a.student_id
) att ON att.student_id = s.id
WHERE s.academy_id = 1 
  AND s.class_id = 1 
  AND s.status = 'active'
  AND s.deleted_at IS NULL
ORDER BY CAST(s.roll_no AS UNSIGNED) ASC;
```

**Plan Details**:
- **Table `s` (Students)**:
  - **Index Used**: `idx_students_class_id`
  - **Access Type**: `ref`
  - **Rows Examined**: `8`
- **Table `a` (Attendance Aggregate)**:
  - **Index Used**: `idx_attendance_class_date`
  - **Access Type**: `range`
  - **Key Length**: `11`
  - **Rows Examined**: `24`
- **Derived Join**:
  - **Key**: `key0`
  - **Ref**: `academy_manager.s.id`
  - **Rows**: `2`
- **Execution Time**: `~3.8 ms`
