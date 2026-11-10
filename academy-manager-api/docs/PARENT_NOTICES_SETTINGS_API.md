# Academy Manager SaaS - Parent Portal, Notices & Settings API Documentation

This document covers the **Parent Portal** (`/api/v1/parent`), **Notices** (`/api/v1/notices`), and **Settings** (`/api/v1/settings`) modules, including security assertions, plan enforcement, and cURL commands with real outputs.

---

## 1. Security & Privacy Architecture

### 1.1. Parent Access Control & Student Ownership (`assertParentOwnsStudent`)
- **Rule**: A parent user (`role: 'parent'`) can **ONLY** access children associated with their account in the `parent_students` table.
- **Critical Privacy Invariant**: Any attempt by Parent A to access Parent B's child returns **`404 Not Found`** rather than `403 Forbidden`. This completely prevents student ID enumeration and protects sensitive student identity.
- **Internal Field Redaction**: Parents are never exposed to internal operational fields (teacher salaries, private administrative notes, internal activity logs).

### 1.2. Cross-Tenant Multi-Academy Isolation
- Every database query strictly filters by `req.user.academyId`.
- Users from Academy 2 attempting to view Academy 1's notices, students, fees, or classes receive **`404 Not Found`**.

### 1.3. Last Owner Protection Guard
- An academy must always retain at least one active owner.
- The system blocks demoting (`PATCH /api/v1/settings/team/:id` with `role: 'teacher'` / `role: 'staff'`) or deleting (`DELETE /api/v1/settings/team/:id`) the last remaining owner with **`400 Bad Request`**.

### 1.4. Subscription Plan Student Limit Enforcement
- Plan tiers:
  - `free_pilot`: Maximum **50** active students
  - `standard`: Maximum **200** active students
  - `pro`: **Unlimited** students
- When an academy hits its active student limit, `POST /api/v1/students` is blocked and returns **`402 Payment Required`**:
  ```json
  {
    "success": false,
    "message": "Student limit reached for the 'free_pilot' plan (maximum 50 active students). Please upgrade your subscription plan to enroll additional students.",
    "code": "PLAN_LIMIT_EXCEEDED"
  }
  ```

---

## 2. Parent Portal Endpoints (`/api/v1/parent`)

All endpoints require `Authorization: Bearer <PARENT_ACCESS_TOKEN>`.

### 2.1. `GET /api/v1/parent/children`
List of all children linked to the authenticated parent with month attendance %, pending fee, and latest result.

#### cURL
```bash
curl -X GET "http://localhost:5000/api/v1/parent/children" \
  -H "Authorization: Bearer <PARENT_A_TOKEN>"
```

#### Response
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Muhammad Ali",
      "rollNo": "C6-01",
      "photoUrl": null,
      "className": "Class 6",
      "classSection": "A",
      "status": "active",
      "attendancePercentageThisMonth": 100.0,
      "pendingFee": 0,
      "latestResult": {
        "examId": 2,
        "examName": "Mid-Term Examination 2026",
        "percentage": 82.5,
        "grade": "A"
      }
    }
  ]
}
```

---

### 2.2. `GET /api/v1/parent/children/:studentId/summary`
Header overview for one child.

#### cURL
```bash
curl -X GET "http://localhost:5000/api/v1/parent/children/1/summary" \
  -H "Authorization: Bearer <PARENT_A_TOKEN>"
```

#### Response
```json
{
  "success": true,
  "data": {
    "student": {
      "id": 1,
      "name": "Muhammad Ali",
      "rollNo": "C6-01",
      "fatherName": "Tariq Mehmood",
      "photoUrl": null,
      "className": "Class 6",
      "classSection": "A",
      "classTeacherName": "Sir Hamza Tariq",
      "timingStart": "15:00:00",
      "timingEnd": "17:00:00",
      "status": "active"
    },
    "attendance": {
      "month": 11,
      "year": 2026,
      "percentage": 100.0,
      "present": 4,
      "absent": 0,
      "late": 0,
      "leave": 0,
      "totalMarked": 4
    },
    "fees": {
      "currentMonthFee": {
        "month": 11,
        "monthName": "November",
        "year": 2026,
        "totalPayable": 2500,
        "paidAmount": 2500,
        "balance": 0,
        "dueDate": "2026-11-10",
        "status": "paid"
      },
      "totalOutstanding": 0
    },
    "latestExam": {
      "examId": 2,
      "name": "Mid-Term Examination 2026",
      "session": "2026-27",
      "percentage": 82.5,
      "grade": "A",
      "status": "pass"
    }
  }
}
```

---

### 2.3. Security Test: Parent A Accessing Parent B's Child
Parent A (`Tariq Mehmood`, owns Student 1) attempts to query Student 2 (belongs to Parent B `Muhammad Asif`).

#### cURL
```bash
curl -i -X GET "http://localhost:5000/api/v1/parent/children/2/summary" \
  -H "Authorization: Bearer <PARENT_A_TOKEN>"
```

#### Real Output (HTTP 404 Not Found)
```http
HTTP/1.1 404 Not Found
Content-Type: application/json; charset=utf-8

{
  "success": false,
  "message": "Student record not found or not associated with your account."
}
```

---

### 2.4. `GET /api/v1/parent/academy-contact`
Academy contact details and auto-generated direct WhatsApp chat link.

#### cURL
```bash
curl -X GET "http://localhost:5000/api/v1/parent/academy-contact" \
  -H "Authorization: Bearer <PARENT_A_TOKEN>"
```

#### Response
```json
{
  "success": true,
  "data": {
    "name": "Bright Future Tuition Academy",
    "phone": "0300-1234567",
    "email": "contact@brightfuture.edu.pk",
    "address": "Main Boulevard, Gulberg III, Lahore",
    "city": "Lahore",
    "logoUrl": null,
    "whatsAppLink": "https://wa.me/923001234567?text=Hello%20Bright%20Future%20Tuition%20Academy%2C%20I%20am%20a%20parent%20contacting%20regarding%20my%20child."
  }
}
```

---

## 3. Notices Module (`/api/v1/notices`)

### 3.1. `POST /api/v1/notices`
Owner and staff can create notices for all audiences. Teachers can create **only** for their assigned classes.

#### Teacher Creating Notice for Class 1 (Success)
```bash
curl -X POST "http://localhost:5000/api/v1/notices" \
  -H "Authorization: Bearer <TEACHER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Physics Chapter 3 Quiz Announcement",
    "body": "Physics quiz on electrostatics will be held this Wednesday.",
    "audience": "class",
    "classId": 1
  }'
```

#### Response (HTTP 201 Created)
```json
{
  "success": true,
  "data": {
    "id": 4,
    "title": "Physics Chapter 3 Quiz Announcement",
    "body": "Physics quiz on electrostatics will be held this Wednesday.",
    "audience": "class",
    "classId": 1,
    "className": "Class 9 - Pre-Engineering",
    "isPinned": false,
    "readCount": 0,
    "author": {
      "id": 2,
      "name": "Sir Hamza Tariq",
      "role": "teacher"
    }
  }
}
```

#### Security Validation: Teacher Attempting Broadcast Notice (HTTP 403 Forbidden)
```bash
curl -i -X POST "http://localhost:5000/api/v1/notices" \
  -H "Authorization: Bearer <TEACHER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Academy Wide Holiday Notice",
    "body": "Academy will remain closed tomorrow.",
    "audience": "all"
  }'
```

#### Output (HTTP 403 Forbidden)
```http
HTTP/1.1 403 Forbidden
Content-Type: application/json; charset=utf-8

{
  "success": false,
  "message": "Teachers may only create notices for their assigned classes."
}
```

---

## 4. Settings Module (`/api/v1/settings`)

### 4.1. `PUT /api/v1/settings/fees` (Template Placeholder Validation)
Validates that `reminderTemplate` uses strictly `{student}`, `{amount}`, `{dueDate}`, `{month}`, `{academy}`.

#### Attempt with invalid variable `{unknownVar}` (HTTP 422 Unprocessable Entity)
```bash
curl -i -X PUT "http://localhost:5000/api/v1/settings/fees" \
  -H "Authorization: Bearer <OWNER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "feeDueDay": 10,
    "lateFeeEnabled": true,
    "lateFeeAmount": 200,
    "reminderTemplate": "Fee of Rs {amount} for {student} is due on {dueDate}. Contact {unknownVar}."
  }'
```

#### Output (HTTP 422 Unprocessable Entity)
```http
HTTP/1.1 422 Unprocessable Entity
Content-Type: application/json; charset=utf-8

{
  "success": false,
  "message": "Validation failed. Please correct the highlighted errors.",
  "errors": [
    {
      "field": "reminderTemplate",
      "message": "Reminder template may only use allowed variables: {student}, {amount}, {dueDate}, {month}, {academy}"
    }
  ]
}
```

---

### 4.2. Last Owner Demotion Guard
Attempting to demote or remove the last remaining owner returns `400 Bad Request`.

#### cURL
```bash
curl -i -X PATCH "http://localhost:5000/api/v1/settings/team/1" \
  -H "Authorization: Bearer <OWNER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{ "role": "teacher" }'
```

#### Output (HTTP 400 Bad Request)
```http
HTTP/1.1 400 Bad Request
Content-Type: application/json; charset=utf-8

{
  "success": false,
  "message": "Cannot demote or deactivate the last remaining owner of the academy."
}
```

---

### 4.3. Subscription Plan Student Limit Enforcement (HTTP 402)
When an academy on `free_pilot` (limit: 50 active students) attempts to enroll an additional student:

#### cURL
```bash
curl -i -X POST "http://localhost:5000/api/v1/students" \
  -H "Authorization: Bearer <OWNER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "classId": 1,
    "name": "Zeeshan Akram",
    "fatherName": "Akram Khan",
    "parentPhone": "0300-9998877",
    "dateOfBirth": "2010-05-15",
    "admissionDate": "2026-11-01"
  }'
```

#### Output (HTTP 402 Payment Required)
```http
HTTP/1.1 402 Payment Required
Content-Type: application/json; charset=utf-8

{
  "success": false,
  "message": "Student limit reached for the 'free_pilot' plan (maximum 50 active students). Please upgrade your subscription plan to enroll additional students.",
  "code": "PLAN_LIMIT_EXCEEDED"
}
```

