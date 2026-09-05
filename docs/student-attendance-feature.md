# STUDENT ATTENDANCE FEATURE DOCUMENTATION

## School SaaS Backend

### 1. Overview

The Student Attendance feature allows authorized school staff to record and manage student attendance while allowing authenticated students to view their own attendance records and attendance summary.

The feature is designed around the existing multi-tenant school architecture, ensuring that:

- Students can only view their own attendance.
- Teachers can record attendance for subjects/classes they are assigned to.
- Administrators have administrative control over attendance.
- Attendance is tied to a student’s enrollment, teacher-subject assignment, academic session, and date.
- Attendance can be summarized by academic term.

# 2. Attendance Status

The system supports four attendance statuses:

```
PRESENT
ABSENT
LATE
EXCUSED
```
These values are represented by the Prisma enum:

```
enum AttendanceStatus {
  PRESENT
  ABSENT
  LATE
  EXCUSED
}
```

### Meaning

| Status | Description |
| --- | --- |
| PRESENT | Student attended the class/day |
| ABSENT | Student was absent |
| LATE | Student attended but arrived late |
| EXCUSED | Student was absent for an approved reason |

# 3. Database Model

The main attendance model is:

```
model Attendance {
  id String @id @default(uuid())

  date DateTime

  status AttendanceStatus

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  enrollmentId String
  enrollment   Enrollment @relation(fields: [enrollmentId], references: [id])

  teacherSubjectId String
  teacherSubject   TeacherSubject @relation(fields: [teacherSubjectId], references: [id])

  markedById String?
  markedBy   User? @relation("AttendanceMarkedBy", fields: [markedById], references: [id])

  @@unique([enrollmentId, teacherSubjectId, date])
}
```

## 3.1 Relationships

An attendance record is connected to:

### Enrollment

```
Attendance
     ↓
Enrollment
     ↓
Student
     ↓
Class
     ↓
Academic Session
```
This identifies which student the attendance belongs to.

### TeacherSubject

```
Attendance
     ↓
TeacherSubject
     ↓
Teacher
Subject
Class
Academic Session
```
This identifies the subject/class context in which the attendance was recorded.

### User

markedById records the user who marked the attendance.

This can be an administrator or teacher.

# 4. Duplicate Attendance Protection

The database contains:

```
@@unique([enrollmentId, teacherSubjectId, date])
```
This prevents the same student from having duplicate attendance records for the same teacher-subject on the same date.

The service layer also checks for existing attendance before creating new records.

This provides protection at both:

- Application level
- Database level

# 5. Attendance Creation

## Endpoint

```
POST /api/v1/attendance
```

## Authorization

```
ADMIN
TEACHER
```
The route uses:

```
router.post(
  "/",
  protect,
  authorize("ADMIN", "TEACHER"),
  createBulkAttendance
);

```

# 6. Bulk Attendance

Attendance is recorded in bulk rather than requiring a separate request for every student.

Example request:

```
{
  "teacherSubjectId": "teacher-subject-id",
  "date": "2026-08-19",
  "attendance": [
    {
      "enrollmentId": "student-enrollment-id-1",
      "status": "PRESENT"
    },
    {
      "enrollmentId": "student-enrollment-id-2",
      "status": "ABSENT"
    },
    {
      "enrollmentId": "student-enrollment-id-3",
      "status": "LATE"
    }
  ]
}
```
This allows a teacher to mark an entire class in one request.

# 7. Attendance Creation Validation

The service performs several validations.

### Teacher subject

The system requires:

```
teacherSubjectId
```
If missing:

```
Teacher subject is required
```

### Attendance array

The request must contain at least one attendance record.

### Duplicate records

Duplicate attendance entries in the same request are rejected.

### Enrollment validation

Every enrollment must:

- Exist.
- Belong to the same school.
- Belong to the selected class.
- Belong to the same academic session.

### Teacher ownership

Teachers can only record attendance for teacher-subject assignments that belong to them.

Administrators are allowed to perform the operation without teacher ownership restrictions.

### Active academic session

Attendance can only be recorded while the academic session is active.

# 8. Attendance Retrieval

## Endpoint

```
GET /api/v1/attendance
```

## Authorization

```
ADMIN
TEACHER
```
The endpoint supports filtering by:

```
teacherSubjectId
studentId
classId
teacherId
sessionId
date
status
```
Example:

```
GET /api/v1/attendance?classId=CLASS_ID&status=PRESENT
```
The results are restricted to the authenticated user’s school.

# 9. Get Attendance by ID

## Endpoint

```
GET /api/v1/attendance/:id
```

## Authorization

```
ADMIN
TEACHER
```
The service verifies that the attendance record belongs to the authenticated user’s school before returning it.

# 10. Update Attendance

## Endpoint

```
PUT /api/v1/attendance/:id
```

## Authorization

```
ADMIN
```
Administrators can update:

```
status
date
```
The system checks for duplicate attendance before updating the record.

Attendance cannot be updated if the academic session is inactive.

# 11. Delete Attendance

## Endpoint

```
DELETE /api/v1/attendance/:id
```

## Authorization

```
ADMIN
```
Administrators can delete attendance records.

The system verifies:

- The record exists.
- The record belongs to the school.
- The academic session is active.

# 12. Student Attendance Endpoint

A separate endpoint was created specifically for students.

## Endpoint

```
GET /api/v1/students/me/attendance
```

## Authorization

```
STUDENT
```
The student does not provide a studentId.

Instead, the student’s identity comes from the JWT:

```
req.user.id
```
This is important for security because a student cannot change a URL parameter to access another student’s attendance.

# 13. Student Attendance Query Parameters

The endpoint requires:

```
sessionId
termId
```
Example:

```
GET /api/v1/students/me/attendance?sessionId=SESSION_ID&termId=TERM_ID
```
Example:

```
GET /api/v1/students/me/attendance?sessionId=9547d456-6687-436e-bb36-5cb2a9bbe131&termId=d7ccdc5c-8ee7-42b5-ac6a-ed122e2aaaef
```
The request requires:

```
Authorization: Bearer STUDENT_JWT
```
No request body is required.

# 14. Student Attendance Security Flow

The student attendance request follows this flow:

```
Student JWT
     ↓
protect middleware
     ↓
Identify student
     ↓
authorize("STUDENT")
     ↓
Get student's enrollment
     ↓
Verify school
     ↓
Verify academic session
     ↓
Verify term
     ↓
Get attendance records
     ↓
Generate attendance summary
     ↓
Return student's attendance
```
The student ID is obtained from:

```
const { id: studentId, schoolId, role } = user;
```
Therefore, the endpoint is not dependent on a user-provided student ID.

# 15. Attendance Summary

The student’s attendance response includes a summary:

```
{
  "totalDays": 0,
  "presentDays": 0,
  "absentDays": 0,
  "lateDays": 0,
  "excusedDays": 0,
  "percentage": 0
}
```

### Fields

| Field | Description |
| --- | --- |
| totalDays | Total attendance records for the term |
| presentDays | Number of PRESENT records |
| absentDays | Number of ABSENT records |
| lateDays | Number of LATE records |
| excusedDays | Number of EXCUSED records |
| percentage | Student’s attendance percentage |

The attendance percentage is currently calculated using:

```
Present Days ÷ Total Attendance Days × 100
```
If there are no attendance records, the percentage is:

```
0

```

# 16. Student Attendance Response

Example:

```
{
  "message": "Student attendance retrieved successfully",
  "data": {
    "student": {
      "id": "student-id",
      "name": "Favour boy",
      "email": "student@example.com"
    },

    "class": {
      "id": "class-id",
      "name": "JSS2A"
    },

    "session": {
      "id": "session-id",
      "name": "2026/2027"
    },

    "term": {
      "id": "term-id",
      "name": "First Term"
    },

    "summary": {
      "totalDays": 6,
      "presentDays": 3,
      "absentDays": 1,
      "lateDays": 1,
      "excusedDays": 1,
      "percentage": 50
    },

    "records": []
  }
}
```
When attendance exists, records contains the individual attendance entries.

# 17. Attendance Records

Each attendance record can include:

```
Attendance ID
Date
Status
Subject
Subject Code
Teacher
```
This allows the student portal to display attendance in a useful format.

For example:

```
Date          Subject             Status
------------------------------------------------
19 Aug 2026   English Language    PRESENT
20 Aug 2026   English Language    ABSENT
21 Aug 2026   English Language    LATE
22 Aug 2026   English Language    EXCUSED

```

# 18. Term-Based Attendance

Student attendance is filtered according to the selected term.

The system uses:

```
term.startDate
term.endDate
```
and retrieves attendance records whose dates fall within that period.

This means the student can view attendance for:

```
First Term
Second Term
Third Term
```
independently.

# 19. Multi-Tenant Security

The school SaaS architecture requires strict school isolation.

Attendance queries therefore verify the student’s enrollment through:

```
session.schoolId
```
The student’s attendance cannot be retrieved from another school.

This maintains the tenant isolation principle used throughout the application.

# 20. Current Student API Structure

The student-facing API currently contains:

```
STUDENT
│
├── GET /students/me
│      └── Student profile
│
├── GET /students/me/classes
│      └── Classes and subjects
│
├── GET /students/me/results
│      └── Academic results
│
├── GET /students/me/report-card
│      └── Published report card
│
└── GET /students/me/attendance
       └── Attendance + summary

```

# 21. Testing

The attendance feature should be tested in the following order.

### Test 1 — Record attendance

Login as:

```
ADMIN
```
or:

```
TEACHER
```
Then:

```
POST /api/v1/attendance
```
Create attendance for one or more students.

### Test 2 — Retrieve attendance

Use:

```
GET /api/v1/attendance
```
Verify that the records were created.

### Test 3 — Login as student

Use the student’s JWT.

### Test 4 — Retrieve student attendance

```
GET /api/v1/students/me/attendance?sessionId=SESSION_ID&termId=TERM_ID
```
Verify that the student’s summary has changed.

For example, after one PRESENT record:

```
{
  "totalDays": 1,
  "presentDays": 1,
  "absentDays": 0,
  "lateDays": 0,
  "excusedDays": 0,
  "percentage": 100
}

```

# 22. Error Handling

The system provides validation errors for situations such as:

```
Session ID is required.
Term ID is required.
Enrollment not found.
Academic session not found.
Term not found.
Attendance not found.
Access denied.
Attendance already recorded.
Attendance can only be recorded for the active academic session.
```
These errors prevent invalid or unauthorized attendance operations.

# 23. Current Implementation Status

| Feature | Status |
| --- | --- |
| Attendance database model | ✅ Complete |
| Attendance statuses | ✅ Complete |
| Bulk attendance creation | ✅ Complete |
| Duplicate protection | ✅ Complete |
| Teacher ownership validation | ✅ Complete |
| School isolation | ✅ Complete |
| Session validation | ✅ Complete |
| Attendance retrieval | ✅ Complete |
| Attendance update | ✅ Complete |
| Attendance deletion | ✅ Complete |
| Student attendance endpoint | ✅ Complete |
| Attendance summary | ✅ Complete |
| Term-based filtering | ✅ Complete |
| Student authorization | ✅ Complete |
| Student attendance testing | ✅ Endpoint verified |

# 24. Future Improvements

Possible future improvements include:

- Attendance percentage based on school days rather than attendance records.
- Monthly attendance reports.
- Class attendance reports.
- Teacher attendance dashboard.
- Admin attendance dashboard.
- Attendance analytics.
- Export attendance to PDF/Excel.
- Parent access to student attendance.
- Attendance notifications.
- Automatic detection of chronic absenteeism.
- Pagination for large attendance datasets.
- Attendance correction/audit history.

# 25. Conclusion

The attendance system is now integrated into the School SaaS backend and connected to the student experience.

The system supports both administrative attendance management and secure student self-service access.

The student can now independently access:

```
Profile
Classes
Results
Report Card
Attendance
```
without being able to access another student’s academic information.

This completes the core student academic information layer of the backend.
