# Tuition Academy Manager - Reminders, Scheduled Cron Jobs & File Storage API Documentation

## Overview
This documentation covers the endpoints and services implemented for:
1. **Reminders Module (`/api/v1/reminders`)**: Pluggable notification service generating Pakistani WhatsApp (`wa.me`) links and tracking delivery logs.
2. **Scheduled Cron Jobs (`src/jobs/`)**: Timezone-aware (`Asia/Karachi`) background automation for monthly fee generation, overdue fee marking, due-soon reminder queueing, and database maintenance.
3. **Storage & File Upload Service (`src/services/storage.js` & `src/middleware/upload.js`)**: Secure multi-directory file storage with extension/MIME validation, 2MB size limit, UUID renaming, and automatic cleanup of replaced files.

---

## Part A: Reminders Module (`/api/v1/reminders`)

All reminder endpoints require authentication and allow only `owner` and `staff` roles. Every query strictly filters by `req.user.academyId`.

### 1. Fee Reminders Preview
- **Route:** `POST /api/v1/reminders/fees/preview`
- **Access:** `owner`, `staff`
- **Request Body:**
  ```json
  {
    "feeIds": [1, 2],
    // OR filter parameters:
    "month": 11,
    "year": 2026,
    "classId": 1,
    "status": "pending"
  }
  ```
- **Response Format:**
  ```json
  {
    "status": "success",
    "data": [
      {
        "studentId": 1,
        "studentName": "Muhammad Ali",
        "parentPhone": "0300-1110001",
        "normalizedPhone": "923001110001",
        "balance": 2500,
        "dueDate": "2026-11-10",
        "month": 11,
        "message": "Dear Tariq Mehmood, Fee Rs 2,500 for Muhammad Ali is due on 2026-11-10. Please clear for November. - Bright Future Tuition Academy",
        "waLink": "https://wa.me/923001110001?text=Dear%20Tariq%20Mehmood%2C%20Fee%20Rs%202%2C500%20for%20Muhammad%20Ali%20is%20due%20on%202026-11-10.%20Please%20clear%20for%20November.%20-%20Bright%20Future%20Tuition%20Academy"
      }
    ]
  }
  ```

### 2. Fee Reminders Dispatch / Send
- **Route:** `POST /api/v1/reminders/fees/send`
- **Access:** `owner`, `staff`
- **Request Body:**
  ```json
  {
    "reminders": [
      {
        "studentId": 1,
        "feeId": 10,
        "parentPhone": "03001110001",
        "message": "Dear Parent...",
        "link": "https://wa.me/923001110001?text=..."
      }
    ],
    "force": false
  }
  ```
- **Rate Limiting:** If a fee reminder was recorded with status `sent` within the last 24 hours for the same `(academy_id, student_id, fee_id)`, it is automatically skipped unless `"force": true` is supplied.
- **Response Format:**
  ```json
  {
    "status": "success",
    "data": {
      "sentCount": 1,
      "skippedCount": 0,
      "links": [
        {
          "studentId": 1,
          "feeId": 10,
          "link": "https://wa.me/923001110001?text=...",
          "status": "sent"
        }
      ]
    }
  }
  ```

### 3. Absent Student Alert
- **Route:** `POST /api/v1/reminders/absent`
- **Access:** `owner`, `staff`
- **Request Body:**
  ```json
  {
    "classId": 1,
    "date": "2026-11-10"
  }
  ```
- **Response Format:**
  ```json
  {
    "status": "success",
    "data": [
      {
        "studentId": 3,
        "studentName": "Usman Tariq",
        "parentPhone": "0300-3330003",
        "normalizedPhone": "923003330003",
        "message": "Attendance Alert: Usman Tariq (Class 6) was marked ABSENT on 2026-11-10. Please contact Bright Future Tuition Academy if this is unexpected.",
        "waLink": "https://wa.me/923003330003?text=..."
      }
    ]
  }
  ```

### 4. Fee Payment Receipt Message
- **Route:** `POST /api/v1/reminders/receipt/:paymentId`
- **Access:** `owner`, `staff`
- **Response Format:**
  ```json
  {
    "status": "success",
    "data": {
      "paymentId": 1,
      "receiptNo": "BFA-2609-001",
      "studentName": "Muhammad Ali",
      "parentPhone": "0300-1110001",
      "normalizedPhone": "923001110001",
      "message": "Payment Receipt Confirmation: Received Rs 2,500 for Muhammad Ali (Class 6) for September fee on 2026-09-08 via CASH. Receipt No: BFA-2609-001. Remaining Fee Balance: Rs 0. Thank you, Bright Future Tuition Academy.",
      "waLink": "https://wa.me/923001110001?text=..."
    }
  }
  ```

### 5. Exam Result Message
- **Route:** `POST /api/v1/reminders/result/:examId/:studentId`
- **Access:** `owner`, `staff`
- **Response Format:**
  ```json
  {
    "status": "success",
    "data": {
      "studentId": 1,
      "studentName": "Muhammad Ali",
      "parentPhone": "0300-1110001",
      "normalizedPhone": "923001110001",
      "percentage": 88,
      "grade": "A",
      "isPassed": true,
      "message": "Exam Result: Muhammad Ali (Class 9) has scored 176/200 (88%, Grade: A, Status: PASSED) in 'Midterm Assessment (November)'. Scores: Mathematics: 90/100, Physics: 86/100. Full report card is viewable in the Parent Portal. - Bright Future Tuition Academy",
      "waLink": "https://wa.me/923001110001?text=..."
    }
  }
  ```

### 6. Reminder Logs & Queue Endpoints
- `GET /api/v1/reminders/logs?page=1&limit=20&date=2026-11-10&status=sent&student=Ali`
  - Returns paginated reminders ledger with student name, class, recipient phone, and dispatch status.
- `GET /api/v1/reminders/queue`
  - Returns all queued reminders awaiting dispatch.
- `POST /api/v1/reminders/queue/send`
  - Body: `{ "ids": [1, 2, 3] }` (or empty to send all queued reminders).
  - Transitions log status from `queued` to `sent` and returns the generated links.

---

## Part B: Scheduled Cron Jobs (`src/jobs/`)

Automated background jobs scheduled with `node-cron` in timezone `Asia/Karachi`:

| Job File | Cron Expression | Schedule | Description |
|---|---|---|---|
| `generateMonthlyFees.job.js` | `30 0 1 * *` | 1st of month at 00:30 PKT | Generates monthly fee invoices for all active students across active academies without duplicates. |
| `markOverdueFees.job.js` | `0 1 * * *` | Daily at 01:00 PKT | Scans unpaid invoices past due date, marks status `overdue`, and adds late fee if not yet applied. |
| `dueSoonReminders.job.js` | `0 9 * * *` | Daily at 09:00 PKT | Finds unpaid fees due within 3 days for academies with `whatsappReminders = true`, and queues reminders. |
| `cleanup.job.js` | `0 3 * * 0` | Every Sunday at 03:00 PKT | Deletes expired/revoked JWT refresh tokens and password reset tokens older than 30 days. |

### Manual On-Demand Job Execution (Owner Only)
- `GET /api/v1/admin/jobs`: List available registered cron jobs and schedules.
- `POST /api/v1/admin/jobs/:name/run`: Manually trigger a cron job by name (e.g. `markOverdueFees`, `generateMonthlyFees`, `dueSoonReminders`, `cleanup`).

---

## Part C: File Uploads & Storage Service

- **Storage Provider:** `src/services/storage.js` implementing a clean interface (`save`, `delete`, `replace`, `getUrl`).
- **Disk Uploads:** Handled by Multer in `src/middleware/upload.js`. Files are stored under `uploads/<type>/` (`students`, `logos`, `documents`, `general`).
- **File Validation:**
  - Max size: 2 Megabytes.
  - Allowed extensions & MIME types: `.jpg`, `.jpeg`, `.png`, `.webp`, `.pdf`.
  - Filenames: Secure random UUIDv4 preventing path traversal and name collisions.
- **Static Hosting Headers:** `app.use('/uploads', ...)` sets:
  - `Cross-Origin-Resource-Policy: cross-origin`
  - `X-Content-Type-Options: nosniff`
- **Auto Cleanup:** Updating an entity's file (e.g. academy logo or student avatar) calls `storageService.replace` to automatically delete the old file from disk upon successful replacement.
