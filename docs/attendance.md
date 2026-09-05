# Attendance Module Documentation

## Overview

The Attendance module is responsible for recording, retrieving, updating, and deleting student attendance records. Attendance is recorded per student, per teacher-subject assignment, on a specific date.

This module ensures that:

- Attendance is recorded only for students enrolled in the correct class.
- Attendance is recorded only within the active academic session.
- Duplicate attendance records cannot exist for the same student, teacher subject, and date.
- Teachers can only manage attendance for subjects assigned to them.
- Administrators have full access to attendance records within their school.

# Attendance Model

```
model Attendance {
  id String @id @default(uuid())

  date DateTime

  status AttendanceStatus

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  enrollmentId String
  enrollment Enrollment @relation(fields: [enrollmentId], references: [id])

  teacherSubjectId String
  teacherSubject TeacherSubject @relation(fields: [teacherSubjectId], references: [id])

  markedById String?
  markedBy User? @relation("AttendanceMarkedBy", fields: [markedById], references: [id])

  @@unique([enrollmentId, teacherSubjectId, date])
}

```

# Relationships

Attendance belongs to:

- One Enrollment
- One TeacherSubject
- One User (who marked the attendance)
Each attendance record uniquely represents:

> One Student + One Subject + One Date

# Attendance Status

Attendance uses the AttendanceStatus enum.

Example:

```
enum AttendanceStatus {
  PRESENT
  ABSENT
  LATE
}

```

# Endpoints

## 1. Create Bulk Attendance

POST

```
/api/v1/attendance
```

### Description

Records attendance for multiple students in a single request.

### Request Body

```
{
  "teacherSubjectId": "teacher-subject-id",
  "date": "2026-08-02",
  "attendance": [
    {
      "enrollmentId": "enrollment-id-1",
      "status": "PRESENT"
    },
    {
      "enrollmentId": "enrollment-id-2",
      "status": "ABSENT"
    }
  ]
}
```

### Validation

- TeacherSubject must exist.
- TeacherSubject must belong to the authenticated school.
- Session must be active.
- User must be the assigned teacher or an administrator.
- Attendance array cannot be empty.
- Duplicate enrollment IDs are not allowed.
- Every enrollment must exist.
- Every enrollment must belong to the same class.
- Every enrollment must belong to the same academic session.
- Attendance for the same student, subject, and date must not already exist.

### Response

Returns all newly created attendance records with:

- Student
- Class
- Session
- Teacher
- Subject
- Marked By

## 2. Get Attendances

GET

```
/api/v1/attendance
```

### Optional Query Parameters

| Parameter | Description |
| --- | --- |
| teacherSubjectId | Filter by teacher subject |
| studentId | Filter by student |
| classId | Filter by class |
| teacherId | Filter by teacher |
| sessionId | Filter by session |
| status | Filter by attendance status |
| date | Filter by attendance date |

### Example

```
GET /api/v1/attendance?classId=class-id&status=PRESENT
```
Returns all attendance records matching the provided filters.

## 3. Get Attendance By ID

GET

```
/api/v1/attendance/:id
```

### Description

Retrieves a single attendance record.

### Validation

- Attendance must exist.
- Attendance must belong to the authenticated user’s school.
Returns:

- Student
- Class
- Session
- Teacher
- Subject
- User who marked attendance

## 4. Update Attendance

PUT

```
/api/v1/attendance/:id
```

### Editable Fields

- status
- date

### Validation

- Attendance must exist.
- Attendance must belong to the authenticated school.
- User must own the teacher subject or be an administrator.
- Academic session must still be active.
- New date must not violate the unique attendance constraint.

### Response

Returns the updated attendance record.

## 5. Delete Attendance

DELETE

```
/api/v1/attendance/:id
```

### Validation

- Attendance must exist.
- Attendance must belong to the authenticated school.
- User must own the teacher subject or be an administrator.
- Academic session must still be active.

### Response

```
{
  "message": "Attendance deleted successfully"
}

```

# Business Rules

- Attendance is recorded only once per student, subject, and date.
- Teachers cannot record attendance for subjects assigned to other teachers.
- Administrators have full access within their school.
- Attendance can only be managed during an active academic session.
- Students must already be enrolled before attendance can be recorded.
- Attendance records cannot be duplicated.
- Attendance updates cannot violate the unique attendance constraint.

# Security

Every attendance query is restricted by school ownership.

All database queries verify:

```
TeacherSubject
      ↓
Session
      ↓
School
```
This prevents users from accessing attendance records belonging to another school.

# Helpers Used

- ensureExists()
- ensureNoDuplicateAttendance()
- validateAttendanceDate()
- checkTeacherOwnership()
- createHttpError()

# Prisma Features Used

- Transactions
- findFirst()
- findMany()
- create()
- update()
- delete()
- Nested include
- Nested where
- Relation filtering
- Compound unique constraint

# Module Summary

The Attendance module provides complete CRUD functionality for managing student attendance.

Features include:

- Bulk attendance recording
- Attendance retrieval with filtering
- Retrieve attendance by ID
- Attendance updates
- Attendance deletion
- Teacher ownership validation
- School isolation
- Duplicate attendance prevention
- Academic session validation
The module follows the same architectural pattern as the Enrollment and Score modules, ensuring consistency, maintainability, and scalability across the School SaaS backend.
