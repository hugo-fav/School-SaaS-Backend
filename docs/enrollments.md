# Enrollment Module Documentation

## Overview

The Enrollment module is responsible for managing the relationship between students, classes, and academic sessions within the School SaaS application.

An enrollment represents a student’s admission into a specific class during a particular academic session. It serves as the foundation for several academic modules, including:

- Scores
- Attendance
- Promotion History
Without an enrollment record, a student cannot receive scores, have attendance recorded, or be promoted to another class.

# Database Model

```
model Enrollment {
  id String @id @default(uuid())

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  studentId String
  student User @relation(fields: [studentId], references: [id])

  classId String
  class Class @relation(fields: [classId], references: [id])

  sessionId String
  session AcademicSession @relation(fields: [sessionId], references: [id])

  scores Score[]

  attendance Attendance[]

  promotions PromotionHistory[]

  @@unique([studentId, sessionId])
}

```

# Purpose

The Enrollment module ensures that:

- A student belongs to only one class per academic session.
- Scores can only be recorded for enrolled students.
- Attendance can only be recorded for enrolled students.
- Promotion records are linked to a student’s enrollment.
- Academic data remains organised and consistent.

# Business Rules

The module enforces the following business rules:

## Student Validation

A student must:

- Exist.
- Belong to the authenticated user’s school.
- Have the role of STUDENT.

## Class Validation

The selected class must:

- Exist.
- Belong to the authenticated user’s school.

## Academic Session Validation

The selected academic session must:

- Exist.
- Belong to the authenticated user’s school.
- Be the currently active academic session.
Students cannot be enrolled into inactive or archived academic sessions.

## Duplicate Enrollment Prevention

A student cannot have more than one enrollment in the same academic session.

This is enforced by:

```
@@unique([studentId, sessionId])
```
Example:

Allowed

- John → JSS1A → 2026/2027
Not Allowed

- John → JSS1A → 2026/2027
- John → JSS1B → 2026/2027
If a student changes class during the same academic session, the existing enrollment should be updated instead of creating a new enrollment.

# API Endpoints

## Create Enrollment

### Endpoint

```
POST /api/v1/enrollments
```

### Purpose

Creates a new enrollment linking a student to a class for an academic session.

### Validation

- Student exists.
- Class exists.
- Academic session exists.
- Academic session is active.
- Student is not already enrolled for the selected session.

### Response

Returns the created enrollment together with:

- Student
- Class
- Academic Session

## Get All Enrollments

### Endpoint

```
GET /api/v1/enrollments
```

### Purpose

Returns all enrollments belonging to the authenticated user’s school.

### Behaviour

- Filters enrollments by school ownership.
- Returns student information.
- Returns class information.
- Returns academic session information.
- Orders records by newest first.

## Get Enrollment By ID

### Endpoint

```
GET /api/v1/enrollments/:id
```

### Purpose

Returns details of a single enrollment.

### Validation

The enrollment must belong to the authenticated user’s school.

If no matching enrollment exists, the API returns:

```
404 Enrollment not found.

```

## Update Enrollment

### Endpoint

```
PUT /api/v1/enrollments/:id
```

### Purpose

Allows changing the student’s assigned class.

### Allowed Update

Only the following field can be updated:

- Class

### Restricted Fields

The following fields cannot be changed:

- Student
- Academic Session
Changing either would fundamentally alter the enrollment record and compromise historical academic data.

### Validation

Before updating:

- Enrollment exists.
- Enrollment belongs to the authenticated user’s school.
- New class exists.
- Student is not already assigned to that class.
- No scores have been recorded.
- No attendance has been recorded.
If scores or attendance already exist, the enrollment becomes locked.

## Delete Enrollment

### Endpoint

```
DELETE /api/v1/enrollments/:id
```

### Purpose

Deletes an enrollment when it is safe to do so.

### Validation

Deletion is blocked if any of the following exist:

- Scores
- Attendance records
- Promotion history
This prevents orphaned records and preserves academic integrity.

# Security

Every enrollment query is restricted by school ownership.

Example:

```
where: {
    session: {
        schoolId
    }
}
```
This ensures users cannot access enrollment records belonging to another school, even if they know a valid enrollment ID.

# Relationships

```
Student
    │
    │
Enrollment
 ├─────────────┐
 │             │
 ▼             ▼
Class     Academic Session
 │
 ├──────── Scores
 ├──────── Attendance
 └──────── Promotion History

```

# Helper Functions Used

The module makes use of shared helper utilities for cleaner, reusable code.

Examples include:

- ensureExists()
- createHttpError()
These helpers reduce duplicate code and ensure consistent error handling across the application.

# Design Decisions

## Why Student Cannot Change

Changing the student would effectively create a completely different enrollment.

Instead:

- Delete the existing enrollment (if permitted).
- Create a new enrollment for the other student.

## Why Academic Session Cannot Change

Academic sessions represent historical records.

Changing the session would move the enrollment into a different academic year and compromise historical accuracy.

A new academic session requires a new enrollment.

## Why Class Can Change

Students may legitimately move between classes during an academic session.

Example:

```
JSS1A

↓

JSS1B
```
This is considered an update rather than a new enrollment.

## Why Updates Are Locked After Scores or Attendance

Once academic records have been entered, changing the student’s class could invalidate those records.

To preserve data consistency, enrollments become locked after:

- Score records exist.
- Attendance records exist.

# Error Responses

Examples include:

```
404 Student not found.
404 Class not found.
404 Academic session not found.
400 Student is already enrolled in this academic session.
400 Students can only be enrolled into the active academic session.
400 Enrollment cannot be updated because scores or attendance have already been recorded.
400 Enrollment cannot be deleted because scores have already been recorded.
400 Enrollment cannot be deleted because attendance has already been recorded.
400 Enrollment cannot be deleted because promotion history already exists.

```

# Summary

The Enrollment module forms the backbone of the academic lifecycle within the School SaaS application. It establishes the connection between students, classes, and academic sessions while providing the foundation for recording scores, tracking attendance, and managing promotions.

By enforcing strict validation, school ownership checks, and business rules, the module ensures data integrity, prevents duplicate enrollments, protects historical academic records, and supports a secure multi-tenant architecture.
