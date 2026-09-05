# TeacherSubject Module Documentation

# Overview

The TeacherSubject Module manages the assignment of teachers to subjects, classes, and academic sessions.

It serves as the central relationship between teachers, subjects, classes, and academic sessions. Every assignment represents a teacher teaching a particular subject to a specific class during a specific academic session.

This module forms the foundation for several other academic modules, including:

- Assessment
- Attendance
- Score
- Report Card
- Teacher Dashboard
The module follows the Service Layer Architecture, where controllers handle HTTP requests and responses while all business logic resides in the service layer.

# Features

- Assign Teacher to Subject
- Get All Teacher Assignments
- Get Single Teacher Assignment
- Update Teacher Assignment
- Delete Teacher Assignment

# Business Rules

## 1. Teacher Must Exist

Before creating or updating an assignment, the system verifies that the teacher exists.

The teacher must belong to the authenticated school.

Example response:

```
{
  "message": "Teacher not found."
}

```

## 2. User Must Have the TEACHER Role

Only users whose role is TEACHER can be assigned to teach subjects.

Administrators and students cannot be assigned.

Validation:

```
where: {
    id: teacherId,
    schoolId,
    role: "TEACHER"
}

```

## 3. Subject Must Exist

The selected subject must belong to the authenticated school.

Example response:

```
{
  "message": "Subject not found."
}

```

## 4. Class Must Exist

The selected class must belong to the authenticated school.

Example response:

```
{
  "message": "Class not found."
}

```

## 5. Academic Session Must Exist

The selected academic session must belong to the authenticated school.

Example response:

```
{
  "message": "Academic session not found."
}

```

## 6. Only Active Academic Sessions Can Receive Assignments

Teachers can only be assigned during the currently active academic session.

Attempting to assign a teacher to an inactive session returns:

```
{
  "message": "Teachers can only be assigned during the active academic session."
}
```
This prevents administrators from accidentally creating assignments for past academic years.

**This rule applies on both create and update** — reassigning an existing
`TeacherSubject` to a different (inactive) session is blocked the same way
as creating a brand-new assignment in one.

## 7. Duplicate Assignments Are Not Allowed

A teacher cannot be assigned to teach the same subject in the same class during the same academic session more than once.

Example:

```
Teacher: John Doe
Subject: Mathematics
Class: JSS1A
Session: 2026/2027
```
This assignment can only exist once.

The validation is enforced in both:

- Service Layer
- Prisma Database Constraint
```
@@unique([teacherId, subjectId, classId, sessionId])

```

## 8. Same Teacher Can Teach Multiple Classes

The system allows one teacher to teach the same subject across multiple classes.

Example:

```
John Doe

Mathematics
├── JSS1A
├── JSS1B
└── JSS2A
```
Each class receives its own TeacherSubject assignment.

## 9. Teacher Assignments Are Session-Based

Assignments are tied to an academic session.

Example:

```
2025/2026

John Doe
Mathematics
JSS1A

↓

2026/2027

John Doe
Mathematics
JSS1A
```
Although the teacher, subject, and class remain the same, these are treated as two separate assignments because they belong to different academic sessions.

## 10. Assignment Cannot Be Deleted When In Use

A TeacherSubject assignment cannot be deleted if it already has:

- Assessment records
- Attendance records
This prevents orphaned records and protects historical academic data.

Example response:

```
{
  "message": "Cannot delete assignment because assessments already exist."
}
```
or

```
{
  "message": "Cannot delete assignment because attendance records already exist."
}

```

# Architecture

The TeacherSubject Module follows the Service Layer Architecture.

```
Routes
    │
    ▼
Controllers
    │
    ▼
Services
    │
    ▼
Prisma ORM
    │
    ▼
PostgreSQL

```

# Responsibilities

## Controller

The controller is responsible for:

- Receiving HTTP requests.
- Calling the appropriate service.
- Returning JSON responses.
No business logic is implemented in the controller.

## Service

The service contains all business logic, including:

- Teacher validation.
- Subject validation.
- Class validation.
- Academic session validation.
- Duplicate assignment validation.
- Active session validation.
- CRUD operations.
- Delete restrictions.

## Validation

Before a request reaches the service layer, `teacherSubject.validation.js`
(Joi) checks that `teacherId`, `subjectId`, `classId`, and `sessionId` are
well-formed UUIDs — `create` requires all four; `update` accepts any
subset (at least one field). This catches malformed IDs immediately,
before the service layer's existence checks run.

## Prisma ORM

Prisma handles all communication with the PostgreSQL database, including:

- Creating assignments.
- Fetching assignments.
- Updating assignments.
- Deleting assignments.
- Enforcing relational integrity.

# API Endpoints

## Assign Teacher

```
POST /api/v1/teacher-subjects
```
Creates a new teacher assignment.

## Get All Assignments

```
GET /api/v1/teacher-subjects
```
Returns all teacher assignments belonging to the authenticated school.

Each assignment includes:

- Teacher
- Subject
- Class
- Academic Session

## Get Single Assignment

```
GET /api/v1/teacher-subjects/:id
```
Returns a single teacher assignment together with its related entities.

## Update Assignment

```
PUT /api/v1/teacher-subjects/:id
```
Allows administrators to update:

- Teacher
- Subject
- Class
- Academic Session
All business rules are revalidated before the update is applied.

## Delete Assignment

```
DELETE /api/v1/teacher-subjects/:id
```
Deletes a teacher assignment only if it has no related assessment or attendance records.

# Security

Every operation is restricted to the authenticated school.

All queries verify ownership using the authenticated administrator’s schoolId.

This ensures administrators cannot:

- View another school’s assignments.
- Create assignments for another school.
- Update another school’s assignments.
- Delete another school’s assignments.

# Database Relationships

The TeacherSubject model connects the following entities:

```
Teacher
      │
      ▼
TeacherSubject
 ├── Subject
 ├── Class
 ├── Academic Session
 ├── Assessment
 └── Attendance
```
This relationship acts as the academic bridge for the system.

# Testing Performed

The following scenarios were successfully tested using Postman:

- ✅ Assign teacher to subject
- ✅ Retrieve all assignments
- ✅ Retrieve a single assignment
- ✅ Update assignment
- ✅ Delete assignment
- ✅ Validate teacher existence
- ✅ Validate subject existence
- ✅ Validate class existence
- ✅ Validate academic session existence
- ✅ Prevent duplicate assignments
- ✅ Prevent assignments to inactive sessions
- ✅ Enforce school-level data isolation

# Conclusion

The TeacherSubject Module is one of the core academic components of the School SaaS application.

It establishes the relationship between teachers, subjects, classes, and academic sessions, providing the foundation for assessments, attendance tracking, student scoring, report card generation, and teacher dashboards.

By enforcing strict validation, preventing duplicate assignments, restricting operations to active academic sessions, and maintaining school-level data isolation, the module ensures a secure, scalable, and maintainable academic management system.

## Related

- [Classes](classes.md) — a class's teacher/subject assignments are shown
  via `GET /classes/:id/members`, sourced from this module. Classes does
  **not** manage teacher assignment directly; that responsibility lives
  entirely here.
- [Teachers](teachers.md) — a teacher's own view of their assignments
  (`/my-classes`, `/my-subjects`) is built on top of this module's data.
- [Subjects](subjects.md), [Academic Sessions](academic-sessions.md) — the
  entities a `TeacherSubject` assignment connects.
- [Assessments](assessments.md), [Attendance](attendance.md) — modules
  that depend on a `TeacherSubject` assignment existing before a teacher
  can mark attendance or create assessments for a class.
