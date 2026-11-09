# Academy Manager API — Students, Classes & Teachers API Reference 📚

Base URL: `http://localhost:5000/api/v1`

All requests require authentication with an access token in the header:
```http
Authorization: Bearer <accessToken>
```

---

## 👥 1. Students Module (`/api/v1/students`)

### Access Rules
- **Owner & Staff**: Full access (Create, Read, Update, Delete, Import, Export, Photo, Promote).
- **Teacher**: Scoped read-only access (only view students enrolled in classes assigned to them).
- **Parent**: Blocked (HTTP 403 Forbidden).

---

### Endpoints

#### 1.1 `GET /students` (List with Filters & Stats)
- **Query Parameters**:
  - `q`: Search by student name, father name, roll number, or phone.
  - `classId`: Filter by class ID.
  - `status`: `active`, `inactive`, `left`, or `all`.
  - `feeStatus`: Current month fee status (`paid`, `pending`, `partial`, `overdue`, or `unbilled`).
  - `sortBy`: `name`, `roll_no`, `created_at`.
  - `order`: `asc` or `desc`.
  - `page`: Page number (default: 1).
  - `limit`: Page limit (default: 10, max: 100).
- **Returns**: Each student record with class name, current month fee status, and attendance percentage.

**Curl Example**:
```bash
curl -X GET "http://localhost:5000/api/v1/students?q=Muhammad&page=1&limit=5&sortBy=name&order=asc" \
  -H "Authorization: Bearer <accessToken>"
```

**Real Response (`200 OK`)**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "academy_id": 1,
      "class_id": 1,
      "roll_no": "601",
      "name": "Muhammad Ali",
      "father_name": "Tariq Mehmood",
      "gender": "male",
      "phone": "0300-1110001",
      "parent_phone": "0300-1110001",
      "monthly_fee": 2500,
      "status": "active",
      "class_name": "Class 6",
      "class_section": "Section A",
      "current_month_fee_status": "paid",
      "current_month_fee_amount": 2500,
      "current_month_fee_paid": 2500,
      "attendance_percentage": "100.0"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 5,
    "total": 5,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

---

#### 1.2 `GET /students/:id` (Full Profile)
- **Returns**: Demographics, Class info, attendance summary for this month, last 6 fee invoices, latest 10 exam results with grades, and linked parent details.

**Curl Example**:
```bash
curl -X GET "http://localhost:5000/api/v1/students/1" \
  -H "Authorization: Bearer <accessToken>"
```

**Real Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Muhammad Ali",
    "father_name": "Tariq Mehmood",
    "roll_no": "601",
    "class_name": "Class 6",
    "class_section": "Section A",
    "monthly_fee": 2500,
    "attendanceSummary": {
      "total_marked_days": 3,
      "present_days": 3,
      "absent_days": 0,
      "late_days": 0,
      "leave_days": 0,
      "attendance_percentage": 100.0
    },
    "feeRecords": [
      {
        "id": 1,
        "month": 11,
        "year": 2026,
        "amount": 2500,
        "paid_amount": 2500,
        "status": "paid"
      }
    ],
    "examResults": [],
    "parent": {
      "parent_user_id": 101,
      "name": "Tariq Mehmood",
      "phone": "0300-1110001",
      "email": "parent.tariq@demo.com"
    }
  }
}
```

---

#### 1.3 `POST /students` (Create Student)
- Auto-generates next roll number if none provided.
- Checks class capacity.
- Auto-creates parent user account if phone does not exist in `users`.
- Executes inside 1 database transaction.

**Curl Example**:
```bash
curl -X POST "http://localhost:5000/api/v1/students" \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Usman Zafar",
    "fatherName": "Zafar Iqbal",
    "classId": 1,
    "parentPhone": "0300-1234567",
    "phone": "0301-1234567",
    "gender": "male",
    "dateOfBirth": "2010-05-15",
    "address": "House 24, Model Town, Lahore"
  }'
```

**Real Response (`201 Created`)**:
```json
{
  "success": true,
  "data": {
    "id": 42,
    "academyId": 1,
    "classId": 1,
    "className": "Class 6",
    "rollNo": "1002",
    "name": "Usman Zafar",
    "fatherName": "Zafar Iqbal",
    "parentPhone": "03001234567",
    "monthlyFee": 2500,
    "status": "active",
    "parentUserId": 121
  }
}
```

---

#### 1.4 `PUT /students/:id` & `PATCH /students/:id` (Update Student)
```bash
curl -X PUT "http://localhost:5000/api/v1/students/42" \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Usman Zafar Updated", "address": "Gulberg, Lahore"}'
```

---

#### 1.5 `POST /students/:id/photo` (Upload Photo)
```bash
curl -X POST "http://localhost:5000/api/v1/students/42/photo" \
  -H "Authorization: Bearer <accessToken>" \
  -F "photo=@avatar.jpg"
```

**Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "photoUrl": "/uploads/students/student-8b22b249-2aa9-474a-86fb-b664f54a4452.jpg"
  }
}
```

---

#### 1.6 `POST /students/:id/promote` & `POST /students/promote-class`
```bash
# Promote single student
curl -X POST "http://localhost:5000/api/v1/students/42/promote" \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"targetClassId": 2}'

# Promote entire class
curl -X POST "http://localhost:5000/api/v1/students/promote-class" \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"currentClassId": 1, "targetClassId": 2}'
```

---

#### 1.7 `GET /students/export` (Export CSV)
```bash
curl -X GET "http://localhost:5000/api/v1/students/export" \
  -H "Authorization: Bearer <accessToken>" \
  -o students_export.csv
```

---

#### 1.8 `POST /students/bulk-import` (CSV Bulk Upload)
```bash
curl -X POST "http://localhost:5000/api/v1/students/bulk-import" \
  -H "Authorization: Bearer <accessToken>" \
  -F "file=@students.csv"
```

**Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "inserted": 25,
    "skipped": 2,
    "errors": [
      { "row": 14, "message": "Class 'Unknown Class' not found in academy." }
    ]
  }
}
```

---

#### 1.9 `DELETE /students/:id` (Soft Delete)
```bash
curl -X DELETE "http://localhost:5000/api/v1/students/42" \
  -H "Authorization: Bearer <accessToken>"
```

---

## 🏫 2. Classes Module (`/api/v1/classes`)

### Access Rules
- **Owner & Staff**: Full access.
- **Teacher**: Read-only access to classes assigned to them.
- **Parent**: Blocked (HTTP 403 Forbidden).

---

### Endpoints

#### 2.1 `GET /classes` (List with Live Attendance & Student Counts)
```bash
curl -X GET "http://localhost:5000/api/v1/classes" \
  -H "Authorization: Bearer <accessToken>"
```

**Real Response (`200 OK`)**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Class 6",
      "section": "Section A",
      "timing_start": "15:00:00",
      "timing_end": "17:00:00",
      "monthly_fee": 2500,
      "capacity": 30,
      "teacher_name": "Sir Hamza Tariq",
      "student_count": 8,
      "today_attendance_pct": "100.0",
      "monthly_attendance_pct": "95.8"
    }
  ]
}
```

---

#### 2.2 `GET /classes/:id` (Class Details, Students & Subjects)
```bash
curl -X GET "http://localhost:5000/api/v1/classes/1" \
  -H "Authorization: Bearer <accessToken>"
```

---

#### 2.3 `POST /classes` (Create Class)
```bash
curl -X POST "http://localhost:5000/api/v1/classes" \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Class 11th Pre-Medical",
    "section": "A",
    "timingStart": "16:00",
    "timingEnd": "19:00",
    "daysOfWeek": "Mon,Tue,Wed,Thu,Fri,Sat",
    "monthlyFee": 4500,
    "teacherId": 1,
    "capacity": 35
  }'
```

---

#### 2.4 `DELETE /classes/:id` (Safe Soft Delete Guard)
- Refuses deletion if class has active students unless `?force=true`.
```bash
curl -X DELETE "http://localhost:5000/api/v1/classes/1" \
  -H "Authorization: Bearer <accessToken>"
# Returns 400 Bad Request: "Cannot delete class: There are 8 active student(s) enrolled..."

curl -X DELETE "http://localhost:5000/api/v1/classes/1?force=true" \
  -H "Authorization: Bearer <accessToken>"
# Returns 200 OK: archives class
```

---

#### 2.5 `POST /classes/:id/subjects` & `DELETE /classes/:id/subjects/:subjectId`
```bash
# Assign Subject
curl -X POST "http://localhost:5000/api/v1/classes/1/subjects" \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"subjectId": 1, "teacherId": 1}'

# Remove Subject
curl -X DELETE "http://localhost:5000/api/v1/classes/1/subjects/1" \
  -H "Authorization: Bearer <accessToken>"
```

---

#### 2.6 `GET /classes/subjects` & `POST /classes/subjects`
```bash
# List academy subjects
curl -X GET "http://localhost:5000/api/v1/classes/subjects" \
  -H "Authorization: Bearer <accessToken>"

# Create new subject
curl -X POST "http://localhost:5000/api/v1/classes/subjects" \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Computer Science & AI"}'
```

---

## 👨‍🏫 3. Teachers Module (`/api/v1/teachers`)

### Access Rules
- **Owner & Staff**: Full access.
- **Teacher & Parent**: Blocked (HTTP 403 Forbidden).

---

### Endpoints

#### 3.1 `GET /teachers`
```bash
curl -X GET "http://localhost:5000/api/v1/teachers?page=1&limit=10" \
  -H "Authorization: Bearer <accessToken>"
```

**Real Response (`200 OK`)**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Sir Hamza Tariq",
      "phone": "0301-5550001",
      "email": "hamza@brightfuture.edu.pk",
      "qualification": "M.Sc Mathematics (PU)",
      "subject": "Mathematics",
      "salary": 45000,
      "joined_on": "2025-01-10",
      "is_active": 1,
      "assigned_class_count": 2,
      "assigned_subject_count": 5
    }
  ]
}
```

---

#### 3.2 `GET /teachers/:id`
```bash
curl -X GET "http://localhost:5000/api/v1/teachers/1" \
  -H "Authorization: Bearer <accessToken>"
```

**Real Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Sir Hamza Tariq",
    "phone": "0301-5550001",
    "email": "hamza@brightfuture.edu.pk",
    "classTeacherOf": [
      {
        "class_id": 1,
        "class_name": "Class 6",
        "section": "Section A",
        "capacity": 30
      }
    ],
    "subjectAssignments": [
      {
        "class_id": 1,
        "class_name": "Class 6",
        "subject_name": "Mathematics"
      }
    ]
  }
}
```

---

#### 3.3 `POST /teachers` (Optionally Create User Login Account)
```bash
curl -X POST "http://localhost:5000/api/v1/teachers" \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sir Bilal Ahmed",
    "phone": "0305-9988776",
    "email": "bilal@brightfuture.edu.pk",
    "qualification": "M.Phil Physics",
    "subject": "Physics",
    "salary": 45000,
    "joinedOn": "2026-09-01",
    "createAccount": true,
    "password": "Teacher@Pass123"
  }'
```

---

#### 3.4 `PUT /teachers/:id`
```bash
curl -X PUT "http://localhost:5000/api/v1/teachers/6" \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"salary": 50000, "qualification": "Ph.D Physics"}'
```

---

#### 3.5 `DELETE /teachers/:id`
- Deactivates teacher (`is_active = FALSE`).
- Deactivates linked user account.
- Unassigns from active classes (`teacher_id = NULL`).
```bash
curl -X DELETE "http://localhost:5000/api/v1/teachers/6" \
  -H "Authorization: Bearer <accessToken>"
```

