# School SaaS Backend

## Report Card & Attendance Integration Documentation

### 1. Overview

The Report Card module has been extended to include the student’s attendance information for the academic term.

Previously, a report card contained academic information such as:

- Student information
- Class
- Academic session
- Term
- Subject results
- Total score
- Average
- Overall grade
- Position
- Teacher remark
- Principal remark
- Publication status
The report card now also contains an attendance summary calculated from the student’s attendance records during the selected term.

# 2. Attendance Model

Attendance is stored using the Attendance model.

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

### Attendance Status

```
enum AttendanceStatus {
  PRESENT
  ABSENT
  LATE
  EXCUSED
}
```
The system currently supports four attendance states:

| Status | Meaning |
| --- | --- |
| PRESENT | Student was present |
| ABSENT | Student was absent |
| LATE | Student arrived late |
| EXCUSED | Student was absent with an approved reason |

# 3. TeacherSubject Relationship

Attendance is connected to the subject/class through TeacherSubject.

```
model TeacherSubject {
  id String @id @default(uuid())

  teacherId String
  teacher   User @relation(fields: [teacherId], references: [id])

  subjectId String
  subject   Subject @relation(fields: [subjectId], references: [id])

  classId String
  class   Class @relation(fields: [classId], references: [id])

  sessionId String
  session   AcademicSession @relation(fields: [sessionId], references: [id])

  assessments Assessment[]
  attendance Attendance[]

  @@unique([teacherId, subjectId, classId, sessionId])
}
```
This means an attendance record is associated with:

- A student enrollment
- A teacher-subject assignment
- A class
- A subject
- An academic session
- The teacher/user who marked the attendance

# 4. Attendance Recording

Attendance can be recorded in bulk using the attendance module.

The system validates:

- teacherSubjectId exists.
- Attendance data is supplied.
- The attendance date is valid.
- Duplicate attendance records are prevented.
- The teacher-subject belongs to the user’s school.
- Teachers can only record attendance for their assigned subjects/classes.
- The academic session must be active.
- Students must belong to the selected class.
- Students must belong to the same academic session.
- Attendance cannot be recorded twice for the same student, subject and date.
The database also provides an additional protection through:

```
@@unique([enrollmentId, teacherSubjectId, date])
```
This prevents duplicate attendance at the database level.

# 5. Attendance Summary

A helper function was introduced to convert individual attendance records into a summary.

```
const getAttendanceSummary = (attendanceRecords) => {
  const totalDays = attendanceRecords.length;

  const presentDays = attendanceRecords.filter(
    (record) => record.status === "PRESENT"
  ).length;

  const absentDays = attendanceRecords.filter(
    (record) => record.status === "ABSENT"
  ).length;

  const lateDays = attendanceRecords.filter(
    (record) => record.status === "LATE"
  ).length;

  const excusedDays = attendanceRecords.filter(
    (record) => record.status === "EXCUSED"
  ).length;

  const percentage =
    totalDays === 0
      ? 0
      : Number(((presentDays / totalDays) * 100).toFixed(2));

  return {
    totalDays,
    presentDays,
    absentDays,
    lateDays,
    excusedDays,
    percentage,
  };
};
```

### Returned fields

| Field | Description |
| --- | --- |
| totalDays | Total attendance records for the term |
| presentDays | Number of days marked PRESENT |
| absentDays | Number of days marked ABSENT |
| lateDays | Number of days marked LATE |
| excusedDays | Number of days marked EXCUSED |
| percentage | Attendance percentage |

# 6. Attendance Percentage

The current percentage is calculated using:

```
Present Days ÷ Total Attendance Days × 100
```
For example:

```
Present = 18
Absent = 1
Late = 1
Excused = 0

Total = 20

Attendance Percentage = (18 ÷ 20) × 100
                       = 90%
```
Important: LATE currently counts as neither PRESENT nor ABSENT when calculating the percentage.

# 7. Attendance Included in Class Report Cards

The class report-card service now retrieves attendance records for every student.

Attendance is restricted to the selected term:

```
const attendanceRecords = await prisma.attendance.findMany({
  where: {
    enrollmentId: reportCard.enrollmentId,

    date: {
      gte: term.startDate,
      lte: term.endDate,
    },
  },
});
```
The records are then passed to:

```
const attendance = getAttendanceSummary(attendanceRecords);
```
The resulting summary is attached to the student’s report card.

# 8. Student Report Card Response

A student’s report card can now contain:

```
"attendance": {
  "totalDays": 20,
  "presentDays": 18,
  "absentDays": 1,
  "lateDays": 1,
  "excusedDays": 0,
  "percentage": 90
}
```
If no attendance has been recorded yet, the response will be:

```
"attendance": {
  "totalDays": 0,
  "presentDays": 0,
  "absentDays": 0,
  "lateDays": 0,
  "excusedDays": 0,
  "percentage": 0
}
```
This is expected behavior and does not mean the attendance module is broken.

It simply means there are currently no attendance records for that student’s enrollment within the selected term.

# 9. Complete Report Card Structure

The report card response now combines academic results, remarks, publication information and attendance.

Example:

```
{
  "id": "report-card-id",

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

  "average": 70,
  "position": 1,

  "teacherRemark": "The student has shown excellent academic progress this term.",

  "principalRemark": "The student has demonstrated excellent academic performance and discipline throughout the term.",

  "published": true,

  "publishedAt": "2026-08-15T07:15:23.775Z",

  "subjects": [
    {
      "subject": {
        "name": "English Language",
        "code": "ENG101"
      },

      "assessments": [
        {
          "title": "CA 1",
          "type": "CA",
          "maxScore": 20,
          "obtainedScore": 14
        }
      ],

      "totalScore": 14,
      "totalPossible": 20,
      "percentage": 70,
      "grade": "A",
      "remark": "Excellent"
    }
  ],

  "totalSubjects": 1,
  "totalObtained": 14,
  "totalPossible": 20,

  "attendance": {
    "totalDays": 20,
    "presentDays": 18,
    "absentDays": 1,
    "lateDays": 1,
    "excusedDays": 0,
    "percentage": 90
  }
}

```

# 10. Class Report Cards

The class report-card endpoint returns the report cards for students belonging to a particular class, session and term.

The endpoint requires:

```
classId
sessionId
termId
```
The service validates that:

- The class belongs to the user’s school.
- The academic session belongs to the user’s school.
- The term belongs to the selected session.
- The report card belongs to the selected class/session/term.
For every report card, academic results are calculated and attendance is retrieved separately.

# 11. Security / Multi-Tenant Protection

The attendance integration continues to respect the application’s school/tenant architecture.

The user’s JWT contains:

```
{
  "id": "user-id",
  "schoolId": "school-id",
  "role": "STUDENT"
}
```
The schoolId is used to prevent users from accessing attendance or academic data belonging to another school.

This is especially important for a SaaS application where multiple schools share the same database.

# 12. Report Card Publication

Report cards have a publication workflow.

A report card can initially be generated with:

```
"published": false
```
The teacher and principal remarks can then be added.

After the report card is completed, it can be published.

Once published:

```
"published": true
```
and:

```
"publishedAt": "2026-08-15T07:15:23.775Z"
```
Published report cards cannot be modified through the existing remark update operations.

# 13. Student Access

Students authenticate using their own JWT.

Example:

```
{
  "id": "student-id",
  "schoolId": "school-id",
  "role": "STUDENT"
}
```
When a student requests their report card, the backend verifies the authenticated student and retrieves the report card associated with their enrollment.

The student can therefore see:

- Their class
- Their academic session
- Their term
- Their subjects
- Their assessments
- Their scores
- Their grades
- Their overall average
- Their position
- Teacher’s remark
- Principal’s remark
- Publication status
- Attendance summary

# 14. Current Attendance Architecture

The current flow is:

```
Teacher/Admin
      │
      ▼
TeacherSubject
      │
      ▼
Attendance Record
      │
      ▼
Enrollment
      │
      ▼
Student
      │
      ▼
Academic Session / Term
      │
      ▼
Report Card
      │
      ▼
Attendance Summary
```
The report card does not store the attendance summary directly.

Instead, the summary is calculated from the attendance records when the report card is requested.

This keeps attendance and report-card data separated and avoids storing duplicate attendance information.

# 15. Important Design Decision

The ReportCard model does not contain fields such as:

```
presentDays
absentDays
lateDays
excusedDays
attendancePercentage
```
Instead, these values are calculated dynamically from the Attendance table.

This is preferable because attendance can change while a report card is being prepared.

The report card therefore reads the latest attendance records when it is retrieved.

# 16. Current Status

The following functionality has now been implemented:

- Attendance model
- Attendance status enum
- Teacher-subject attendance relationship
- Bulk attendance recording
- Duplicate attendance protection
- Attendance validation
- Teacher ownership validation
- Attendance retrieval
- Attendance update
- Attendance deletion
- Term-based attendance filtering
- Attendance summary calculation
- Attendance included in class report cards
- Attendance included in student report cards
- EXCUSED attendance support
- Attendance percentage
- Student access to published report cards
- Report-card publication workflow

# 17. Recommended Next Development Steps

The backend now has a strong foundation for the academic/reporting side of the School SaaS.

Recommended next steps are:

### 1. Attendance API testing

Test:

- Create attendance
- Get attendance
- Get attendance by ID
- Update attendance
- Delete attendance
- Duplicate attendance
- Wrong class
- Wrong session
- Wrong teacher
- Different school access

### 2. Student dashboard

Expose the student’s:

- Current class
- Current session
- Current term
- Report card
- Attendance
- Subjects
- Academic performance

### 3. Admin dashboard

Provide statistics such as:

- Number of students
- Number of teachers
- Number of classes
- Attendance rate
- Published report cards
- Pending report cards

### 4. Teacher dashboard

Teachers should be able to see:

- Assigned classes
- Assigned subjects
- Students
- Assessments
- Attendance
- Results

### 5. Report-card PDF generation

Generate a printable/downloadable report card containing:

```
School Information
        ↓
Student Information
        ↓
Academic Session / Term
        ↓
Subject Results
        ↓
Overall Performance
        ↓
Attendance
        ↓
Teacher Remark
        ↓
Principal Remark
        ↓
Publication Information
```

### 6. Attendance improvements

Possible future improvements include:

- Monthly attendance statistics
- Attendance percentage per subject
- Class attendance percentage
- School-wide attendance statistics
- Attendance reports
- Attendance trends
- Late-arrival statistics

# 18. Final Architecture

The current academic reporting architecture can be summarized as:

```
SCHOOL
                      │
          ┌───────────┴───────────┐
          │                       │
       USERS                  CLASSES
          │                       │
          │                  ENROLLMENTS
          │                       │
          │                       ▼
          │                    STUDENTS
          │                       │
          ▼                       │
    TEACHER SUBJECT               │
          │                       │
     ┌────┴─────┐                 │
     │          │                 │
ASSESSMENTS  ATTENDANCE           │
     │          │                 │
     └────┬─────┘                 │
          │                       │
          ▼                       ▼
       SCORES                ATTENDANCE
          │                   RECORDS
          │                       │
          └──────────┬────────────┘
                     │
                     ▼
                REPORT CARD
                     │
          ┌──────────┼──────────┐
          │          │          │
       RESULTS    REMARKS   ATTENDANCE
          │          │          │
          └──────────┼──────────┘
                     │
                     ▼
              PUBLISHED REPORT
                     │
                     ▼
                  STUDENT
```
This structure keeps attendance, assessments, scores, enrollments and report cards as separate responsibilities, while combining them at the reporting layer when the student or administrator requests a complete academic report.
