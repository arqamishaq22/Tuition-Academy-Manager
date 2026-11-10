# Academy Manager API — Fees & Billing Module Reference 💰

Base URL: `http://localhost:5000/api/v1/fees`

All requests require authentication with an access token in the header:
```http
Authorization: Bearer <accessToken>
```

---

## 🔒 Access Rules & Security
- **Owner & Staff**: Full access to generate invoices, view summaries, list fees, view student ledgers, collect payments, view transactions, print receipts, view defaulters, export CSV, and manage fee structures.
- **Owner Only**:
  - `DELETE /payments/:id`: Reversing payment transactions (requires audit reason).
  - `PATCH /:id`: Adjusting fee amounts, late fees, and due dates.
- **Teacher**: Blocked from all fee routes (HTTP 403 Forbidden).
- **Parent**: Blocked from management routes (HTTP 403 Forbidden; parent portal endpoints built separately).

---

## 📐 Business Rules & Concurrency Design

1. **PKR Whole Integer Currency**:
   - All monetary amounts (`amount`, `paid_amount`, `late_fee`, `balance`) are non-negative whole integer PKR values (no decimal floats).

2. **Standardized Fee Status (`calculateFeeStatus`)**:
   - `paid`: `paidAmount >= (amount + lateFee)`
   - `overdue`: `balance > 0` AND `dueDate < today (Asia/Karachi)`
   - `partial`: `balance > 0` AND `paidAmount > 0` AND `dueDate >= today`
   - `pending`: `balance > 0` AND `paidAmount === 0` AND `dueDate >= today`

3. **Concurrency-Safe Sequential Receipt Generation**:
   - Format: `RCPT-YYYY-XXXXXX` (e.g. `RCPT-2026-000001`).
   - Atomic locked query within active transaction (`FOR UPDATE`):
     ```sql
     SELECT MAX(CAST(SUBSTRING(receipt_no, 11) AS UNSIGNED)) AS max_seq
     FROM payments
     WHERE academy_id = :academyId AND receipt_no LIKE 'RCPT-YYYY-%'
     FOR UPDATE;
     ```

4. **Row-Level Locking Against Race Conditions**:
   - In `POST /payments`, `DELETE /payments/:id`, and `PATCH /:id`, the fee record is locked using:
     ```sql
     SELECT * FROM fees WHERE id = :feeId AND academy_id = :academyId FOR UPDATE;
     ```
   - Prevents simultaneous overdraws or race conditions when two clients submit payments on the same invoice.

5. **Multi-Month Oldest-First Payment Allocation**:
   - Providing `{ studentId, amount, method }` without `feeId` automatically locks and allocates the payment across unpaid months chronologically (`ORDER BY year ASC, month ASC`).

6. **Fully Paid Fee Protection**:
   - An invoice that has `paid_amount >= (amount + late_fee)` can **never** be edited or discounted via `PATCH /:id`. Reversal must be executed first.

---

## 🚀 Endpoints & Curl Examples

### 1. `POST /generate` (Bulk Monthly Invoice Generation)
Generates invoices for active students admitted on or before the period. Idempotent: skipping students who already have invoices.

```bash
curl -X POST "http://localhost:5000/api/v1/fees/generate" \
  -H "Authorization: Bearer <ownerToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "month": 12,
    "year": 2026,
    "classId": 1
  }'
```

**Response (`201 Created`)**:
```json
{
  "success": true,
  "data": {
    "created": 8,
    "skipped": 0,
    "month": 12,
    "year": 2026,
    "dueDate": "2026-12-10"
  }
}
```

---

### 2. `GET /` (List Fees with Filters & Pagination)
Filters by `month`, `year`, `classId`, `status` (`pending`, `partial`, `paid`, `overdue`), search query `q` (name, roll no, father name), with sorting and pagination.

```bash
curl -X GET "http://localhost:5000/api/v1/fees?month=12&year=2026&page=1&limit=10&sortBy=student_name&order=asc" \
  -H "Authorization: Bearer <ownerToken>"
```

**Response (`200 OK`)**:
```json
{
  "success": true,
  "data": [
    {
      "id": 150,
      "academyId": 1,
      "studentId": 1,
      "studentName": "Muhammad Ali",
      "rollNo": "C6-01",
      "fatherName": "Tariq Mehmood",
      "parentPhone": "0300-1110001",
      "classId": 1,
      "className": "Class 6",
      "classSection": "A",
      "month": 12,
      "monthName": "December",
      "year": 2026,
      "amount": 2500,
      "paidAmount": 0,
      "lateFee": 0,
      "balance": 2500,
      "dueDate": "2026-12-10",
      "status": "pending",
      "createdAt": "2026-11-10 15:00:00"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 44,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

### 3. `GET /summary?month=&year=` (Monthly Collection Summary)
Aggregated metrics including expected collection, collected amount, pending/overdue balances, collection percentage, and status counts.

```bash
curl -X GET "http://localhost:5000/api/v1/fees/summary?month=12&year=2026" \
  -H "Authorization: Bearer <ownerToken>"
```

**Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "month": 12,
    "monthName": "December",
    "year": 2026,
    "expected": 138100,
    "collected": 85000,
    "pending": 53100,
    "overdue": 0,
    "collectionPercent": 61.5,
    "countByStatus": {
      "pending": 15,
      "partial": 5,
      "paid": 24,
      "overdue": 0,
      "total": 44
    }
  }
}
```

---

### 4. `GET /student/:studentId` (Full Student Fee Ledger)
Returns lifetime billing history, payments grouped per invoice, and total outstanding dues.

```bash
curl -X GET "http://localhost:5000/api/v1/fees/student/1" \
  -H "Authorization: Bearer <ownerToken>"
```

**Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "student": {
      "id": 1,
      "name": "Muhammad Ali",
      "rollNo": "C6-01",
      "fatherName": "Tariq Mehmood",
      "parentPhone": "0300-1110001",
      "className": "Class 6",
      "monthlyFee": 2500,
      "discount": 0
    },
    "summary": {
      "totalBilled": 10000,
      "totalPaid": 7500,
      "totalBalance": 2500,
      "pendingMonthsCount": 1,
      "totalInvoicesCount": 4
    },
    "fees": [
      {
        "id": 150,
        "month": 12,
        "monthName": "December",
        "year": 2026,
        "amount": 2500,
        "lateFee": 0,
        "totalPayable": 2500,
        "paidAmount": 0,
        "balance": 2500,
        "dueDate": "2026-12-10",
        "status": "pending",
        "payments": []
      }
    ]
  }
}
```

---

### 5. `POST /payments` (Collect Payment)

#### A. Single Fee Payment:
```bash
curl -X POST "http://localhost:5000/api/v1/fees/payments" \
  -H "Authorization: Bearer <ownerToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "feeId": 150,
    "amount": 2500,
    "method": "easypaisa",
    "note": "December fee paid in full"
  }'
```

**Response (`201 Created`)**:
```json
{
  "success": true,
  "data": {
    "isMultiMonth": false,
    "payment": {
      "id": 151,
      "feeId": 150,
      "studentId": 1,
      "receiptNo": "RCPT-2026-000005",
      "amount": 2500,
      "method": "easypaisa",
      "paidOn": "2026-11-10",
      "note": "December fee paid in full"
    },
    "updatedFee": {
      "id": 150,
      "month": 12,
      "year": 2026,
      "amount": 2500,
      "lateFee": 0,
      "paidAmount": 2500,
      "balance": 0,
      "status": "paid"
    }
  }
}
```

#### B. Multi-Month Allocation:
```bash
curl -X POST "http://localhost:5000/api/v1/fees/payments" \
  -H "Authorization: Bearer <ownerToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": 1,
    "amount": 5000,
    "method": "cash",
    "note": "Advance quarterly fee payment"
  }'
```

---

### 6. `GET /payments` (Transaction History with Range Totals)
```bash
curl -X GET "http://localhost:5000/api/v1/fees/payments?startDate=2026-11-01&endDate=2026-11-30&method=easypaisa&page=1&limit=10" \
  -H "Authorization: Bearer <ownerToken>"
```

**Response (`200 OK`)**:
```json
{
  "success": true,
  "data": [
    {
      "id": 151,
      "receiptNo": "RCPT-2026-000005",
      "amount": 2500,
      "method": "easypaisa",
      "paidOn": "2026-11-10",
      "student": {
        "id": 1,
        "name": "Muhammad Ali",
        "rollNo": "C6-01",
        "className": "Class 6"
      },
      "receivedBy": "Arqam Ishaq"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1,
    "rangeTotals": {
      "totalAmount": 2500,
      "count": 1
    }
  }
}
```

---

### 7. `GET /payments/:id/receipt` (Printable Digital Receipt)
```bash
curl -X GET "http://localhost:5000/api/v1/fees/payments/151/receipt" \
  -H "Authorization: Bearer <ownerToken>"
```

**Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "academy": {
      "id": 1,
      "name": "Bright Future Academy",
      "address": "Main Canal Road, Near Campus 2",
      "phone": "0300-1234567",
      "email": "info@brightfuture.edu.pk"
    },
    "student": {
      "id": 1,
      "name": "Muhammad Ali",
      "rollNo": "C6-01",
      "fatherName": "Tariq Mehmood",
      "className": "Class 6",
      "section": "A"
    },
    "fee": {
      "id": 150,
      "month": 12,
      "monthName": "December",
      "year": 2026,
      "amount": 2500,
      "lateFee": 0,
      "totalPayable": 2500,
      "dueDate": "2026-12-10"
    },
    "payment": {
      "id": 151,
      "receiptNo": "RCPT-2026-000005",
      "amount": 2500,
      "method": "easypaisa",
      "paidOn": "2026-11-10",
      "receivedBy": "Arqam Ishaq"
    },
    "balanceAfterPayment": 0,
    "studentTotalBalance": 0
  }
}
```

---

### 8. `DELETE /payments/:id` (Payment Reversal — Owner Only)
Reverses a payment transaction, deducts `paid_amount`, recomputes fee status, and logs audit trail.

```bash
curl -X DELETE "http://localhost:5000/api/v1/fees/payments/151" \
  -H "Authorization: Bearer <ownerToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Payment recorded in cash drawer error"
  }'
```

**Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "message": "Payment reversed successfully.",
    "reversedPaymentId": 151,
    "receiptNo": "RCPT-2026-000005",
    "amount": 2500,
    "reason": "Payment recorded in cash drawer error",
    "updatedFee": {
      "id": 150,
      "paidAmount": 0,
      "balance": 2500,
      "status": "pending"
    }
  }
}
```

---

### 9. `PATCH /:id` (Fee Adjustment — Owner Only)
Adjusts base amount, late fee, or due date on an invoice. Blocked if the fee is already fully paid.

```bash
curl -X PATCH "http://localhost:5000/api/v1/fees/150" \
  -H "Authorization: Bearer <ownerToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "lateFee": 200,
    "dueDate": "2026-12-15",
    "note": "Extended due date granted by management"
  }'
```

**Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "id": 150,
    "studentId": 1,
    "month": 12,
    "year": 2026,
    "amount": 2500,
    "lateFee": 200,
    "paidAmount": 0,
    "balance": 2700,
    "dueDate": "2026-12-15",
    "status": "pending"
  }
}
```

---

### 10. `GET /defaulters?minMonths=1` (Overdue Students List)
Lists active students who have overdue fees across $\ge \text{minMonths}$ months, sorted by outstanding balance descending.

```bash
curl -X GET "http://localhost:5000/api/v1/fees/defaulters?minMonths=1" \
  -H "Authorization: Bearer <ownerToken>"
```

**Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "minMonths": 1,
    "totalDefaulters": 8,
    "totalOverdueAmount": 8000,
    "defaulters": [
      {
        "studentId": 12,
        "studentName": "Zain Ali",
        "rollNo": "C8-02",
        "fatherName": "Imran Ali",
        "className": "Class 8",
        "parentPhone": "0300-1110012",
        "lastPaymentDate": "2026-09-08",
        "totalOutstandingBalance": 3500,
        "overdueMonthsCount": 1,
        "overdueMonths": [
          {
            "feeId": 45,
            "month": 10,
            "monthName": "October",
            "year": 2026,
            "amount": 3500,
            "lateFee": 0,
            "paidAmount": 0,
            "balance": 3500,
            "dueDate": "2026-10-10",
            "daysOverdue": 31
          }
        ]
      }
    ]
  }
}
```

---

### 11. `GET /export?month=&year=` (CSV Export)
Streams the entire monthly fee ledger as a CSV file.

```bash
curl -X GET "http://localhost:5000/api/v1/fees/export?month=12&year=2026" \
  -H "Authorization: Bearer <ownerToken>" \
  -o "fee-ledger-2026-12.csv"
```

**Headers**:
```http
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="fee-ledger-2026-12.csv"
```

---

### 12. `GET /structure` & `PUT /structure` (Fee Structure Management)
Lists monthly tuition fee per class and allows bulk updates with optional cascading updates to active students.

```bash
# Get structure
curl -X GET "http://localhost:5000/api/v1/fees/structure" \
  -H "Authorization: Bearer <ownerToken>"

# Update structure
curl -X PUT "http://localhost:5000/api/v1/fees/structure" \
  -H "Authorization: Bearer <ownerToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "updates": [
      { "classId": 1, "monthlyFee": 4000 }
    ],
    "applyToActiveStudents": true,
    "fromMonth": 1,
    "fromYear": 2027
  }'
```
