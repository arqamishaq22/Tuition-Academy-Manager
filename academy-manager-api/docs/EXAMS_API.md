# Academy Manager API — Examination & Results Module Reference 📝

Base URL: `http://localhost:5000/api/v1/exams` (also aliased at `/api/v1/results`)

All requests require authentication with an access token in the header:
```http
Authorization: Bearer <accessToken>
```

---

## 🔒 Access Rules & Permissions

- **Owner & Staff**: Full access to create, view, edit, publish, and delete exams, enter marks, and view class result sheets and report cards.
- **Teacher**:
  - Can create exams for classes they are incharge of.
  - Can view exams and students for classes they are assigned to.
  - Can enter and edit marks **only for their assigned classes and subjects**.
  - Can view results of their assigned classes.
  - Cannot unpublish an exam (`POST /:id/unpublish` is strictly Owner only).
  - Cannot force-delete an exam with recorded student marks.
- **Parent**: Read-only access through parent portal endpoints. Only **published** exams and report cards are visible to parents.

---

## 📐 Grading Scale & Formulas (`src/utils/grade.js`)

1. **Academic Grade Mapping**:
   - $\ge 90\%$: **A+**
   - $80\% - 89.9\%$: **A**
   - $70\% - 79.9\%$: **B**
   - $60\% - 69.9\%$: **C**
   - $50\% - 59.9\%$: **D**
   - $< 50\%$: **F**

2. **Passing Criteria**:
   - **Subject Pass**: $\text{Marks Obtained} \ge \text{Passing Marks}$ (and not marked `isAbsent`).
   - **Overall Pass**: A student **fails overall** if **any** subject is failed.

3. **Dense Ranking with Ties Handled**:
   - Students are ranked by total obtained marks descending.
   - Tied scores share the exact same rank position.
   - Subsequent scores receive the next sequential rank (e.g. 1st, 2nd, 2nd, 3rd, 4th, 4th, 5th).

4. **Publishing Integrity**:
   - An exam can only be published if **every active student** in the class has recorded marks (or an `isAbsent` entry) for **every assigned subject**.
   - Marks are locked against editing once an exam is published. Only an **owner** can unpublish it to permit edits.

---

## 🚀 Endpoints & Curl Examples

### 1. `POST /` (Create Examination with Assigned Subjects)

Creates an exam with subjects and passing thresholds in one atomic transaction.

```bash
curl -X POST "http://localhost:5000/api/v1/exams" \
  -H "Authorization: Bearer <ownerOrTeacherToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "classId": 1,
    "name": "Mid-Term Examination 2026",
    "examType": "mid_term",
    "startDate": "2026-11-15",
    "sessionLabel": "2026-27",
    "subjects": [
      { "subjectId": 1, "totalMarks": 50, "passingMarks": 20 },
      { "subjectId": 2, "totalMarks": 50, "passingMarks": 20 }
    ]
  }'
```

**Real Output (`201 Created`)**:
```json
{
  "success": true,
  "data": {
    "id": 4,
    "academyId": 1,
    "classId": 1,
    "className": "Class 6",
    "name": "Mid-Term Examination 2026",
    "examType": "mid_term",
    "startDate": "2026-11-15",
    "sessionLabel": "2026-27",
    "status": "upcoming",
    "subjects": [
      {
        "id": 5,
        "subjectId": 1,
        "subjectName": "Mathematics",
        "totalMarks": 50,
        "passingMarks": 20
      },
      {
        "id": 6,
        "subjectId": 2,
        "subjectName": "English",
        "totalMarks": 50,
        "passingMarks": 20
      }
    ]
  }
}
```

---

### 2. `GET /` (List Exams with Filters & Entry Progress)

```bash
curl -X GET "http://localhost:5000/api/v1/exams?classId=1&status=all" \
  -H "Authorization: Bearer <ownerOrTeacherToken>"
```

**Real Output (`200 OK`)**:
```json
{
  "success": true,
  "data": [
    {
      "id": 4,
      "academyId": 1,
      "classId": 1,
      "className": "Class 6",
      "classSection": "A",
      "name": "Mid-Term Examination 2026",
      "examType": "mid_term",
      "startDate": "2026-11-15",
      "sessionLabel": "2026-27",
      "status": "upcoming",
      "subjectsCount": 2,
      "activeStudentsCount": 8,
      "marksProgress": {
        "entered": 0,
        "expected": 16,
        "percentage": 0
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

---

### 3. `GET /:id` (Exam Details, Subjects & Summary Metrics)

```bash
curl -X GET "http://localhost:5000/api/v1/exams/4" \
  -H "Authorization: Bearer <ownerOrTeacherToken>"
```

**Real Output (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "exam": {
      "id": 4,
      "name": "Mid-Term Examination 2026",
      "examType": "mid_term",
      "startDate": "2026-11-15",
      "status": "published",
      "className": "Class 6"
    },
    "subjects": [
      { "examSubjectId": 5, "subjectName": "Mathematics", "totalMarks": 50, "passingMarks": 20 },
      { "examSubjectId": 6, "subjectName": "English", "totalMarks": 50, "passingMarks": 20 }
    ],
    "summary": {
      "totalStudentsInClass": 8,
      "evaluatedStudents": 8,
      "average": 76.1,
      "highest": 87,
      "lowest": 40,
      "passedCount": 7,
      "failedCount": 1,
      "passPercentage": 87.5,
      "gradeDistribution": {
        "A+": 0,
        "A": 3,
        "B": 4,
        "C": 0,
        "D": 0,
        "F": 1
      },
      "topStudents": [
        {
          "position": 1,
          "studentId": 6,
          "studentName": "Usman Ghani",
          "rollNo": "C6-06",
          "totalMarks": 100,
          "obtainedMarks": 87,
          "percentage": 87,
          "grade": "A"
        }
      ]
    }
  }
}
```

---

### 4. `GET /:id/marks?subjectId=` (View Score Sheet Roster)

```bash
curl -X GET "http://localhost:5000/api/v1/exams/4/marks?subjectId=1" \
  -H "Authorization: Bearer <ownerOrTeacherToken>"
```

**Real Output (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "exam": {
      "id": 4,
      "name": "Mid-Term Examination 2026",
      "className": "Class 6"
    },
    "subject": {
      "subjectName": "Mathematics",
      "totalMarks": 50,
      "passingMarks": 20
    },
    "progress": {
      "entered": 8,
      "total": 8,
      "percentage": 100
    },
    "students": [
      {
        "studentId": 1,
        "studentName": "Muhammad Ali",
        "rollNo": "C6-01",
        "marksObtained": 40,
        "isAbsent": false,
        "isPassed": true,
        "isEntered": true
      }
    ]
  }
}
```

---

### 5. `POST /:id/marks` (Bulk Save Marks with Absent Flag)

```bash
curl -X POST "http://localhost:5000/api/v1/exams/4/marks" \
  -H "Authorization: Bearer <ownerOrTeacherToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "subjectId": 1,
    "records": [
      { "studentId": 1, "marksObtained": 40, "isAbsent": false },
      { "studentId": 8, "marksObtained": null, "isAbsent": true }
    ]
  }'
```

**Real Output (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "savedCount": 2,
    "message": "Marks saved successfully."
  }
}
```

---

### 6. `POST /:id/publish` & `POST /:id/unpublish`

#### A. Publish Exam:
```bash
curl -X POST "http://localhost:5000/api/v1/exams/4/publish" \
  -H "Authorization: Bearer <ownerOrTeacherToken>"
```

**Real Output (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "message": "Exam published successfully. Results and report cards are now accessible.",
    "examId": 4,
    "status": "published"
  }
}
```

#### B. Unpublish Exam (Owner Only):
```bash
curl -X POST "http://localhost:5000/api/v1/exams/4/unpublish" \
  -H "Authorization: Bearer <ownerToken>"
```

**Real Output (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "message": "Exam unpublished successfully. Marks can now be edited.",
    "examId": 4,
    "status": "marks_pending"
  }
}
```

---

### 7. `GET /:id/results` (Full Class Result Sheet with Dense Ranks)

```bash
curl -X GET "http://localhost:5000/api/v1/exams/4/results" \
  -H "Authorization: Bearer <ownerOrTeacherToken>"
```

**Real Output (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "exam": {
      "id": 4,
      "name": "Mid-Term Examination 2026",
      "className": "Class 6"
    },
    "summary": {
      "totalStudents": 8,
      "passedCount": 7,
      "failedCount": 1,
      "passPercentage": 87.5,
      "classAverage": 76.1
    },
    "results": [
      {
        "position": 1,
        "studentId": 6,
        "studentName": "Usman Ghani",
        "rollNo": "C6-06",
        "totalMarks": 100,
        "totalObtained": 87,
        "percentage": 87,
        "grade": "A",
        "status": "pass",
        "subjects": [
          { "subjectName": "Mathematics", "marksObtained": 45, "percentage": 90, "grade": "A+", "isPassed": true },
          { "subjectName": "English", "marksObtained": 42, "percentage": 84, "grade": "A", "isPassed": true }
        ]
      }
    ]
  }
}
```

---

### 8. `PUT /:id/remarks/:studentId` (Teacher Remarks)

```bash
curl -X PUT "http://localhost:5000/api/v1/exams/4/remarks/1" \
  -H "Authorization: Bearer <teacherToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "remark": "Consistently outstanding performance throughout the academic session."
  }'
```

---

### 9. `GET /:id/report-card/:studentId` (Complete Report Card)

```bash
curl -X GET "http://localhost:5000/api/v1/exams/4/report-card/1" \
  -H "Authorization: Bearer <ownerOrTeacherToken>"
```

**Real Output (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "academy": {
      "name": "Bright Future Academy",
      "address": "Main Canal Road, Near Campus 2",
      "phone": "0300-1234567"
    },
    "student": {
      "id": 1,
      "name": "Muhammad Ali",
      "fatherName": "Tariq Mehmood",
      "rollNo": "C6-01",
      "className": "Class 6"
    },
    "performance": {
      "totalMarks": 100,
      "obtainedMarks": 75,
      "percentage": 75,
      "grade": "B",
      "position": 7,
      "status": "pass",
      "totalStudentsInClass": 8
    },
    "attendance": {
      "examPeriod": "2026-11",
      "attendancePercentage": 100
    },
    "progressSeries": [
      {
        "examId": 1,
        "examName": "Monthly Assessment 1 (October)",
        "percentage": 82.5,
        "grade": "A"
      },
      {
        "examId": 4,
        "examName": "Mid-Term Examination 2026",
        "percentage": 75,
        "grade": "B"
      }
    ],
    "teacherRemark": {
      "remark": "Consistently outstanding performance throughout the academic session.",
      "teacherName": "Sir Hamza Tariq"
    }
  }
}
```

---

### 10. `GET /:id/results/export` (Download CSV Result Sheet)

```bash
curl -X GET "http://localhost:5000/api/v1/exams/4/results/export" \
  -H "Authorization: Bearer <ownerOrTeacherToken>" \
  -o "result-sheet.csv"
```

**Output CSV Format**:
```csv
Roll No,Student Name,Father Name,Mathematics (50),English (50),Total Marks,Obtained Marks,Percentage,Grade,Position,Result
"C6-06","Usman Ghani","Ghani Ur Rehman",45,42,100,87,87%,"A",1,"PASS"
"C6-05","Fatima Noor","Noor Muhammad",44,41,100,85,85%,"A",2,"PASS"
"C6-08","Hassan Raza","Raza Ali",Absent,43,100,43,43%,"F",8,"FAIL"
```

---

### 11. `DELETE /:id` (Safe Delete & Force Delete)

- **Attempt without force when marks exist**:
  ```bash
  curl -X DELETE "http://localhost:5000/api/v1/exams/4" \
    -H "Authorization: Bearer <ownerToken>"
  ```
  Returns `400 Bad Request`:
  `"Cannot delete exam with existing student marks. To delete anyway, owner must pass ?force=true."`

- **Owner force delete**:
  ```bash
  curl -X DELETE "http://localhost:5000/api/v1/exams/4?force=true" \
    -H "Authorization: Bearer <ownerToken>"
  ```
  Returns `200 OK`:
  `"Exam and associated subjects deleted successfully."`

