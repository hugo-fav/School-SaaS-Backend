# Student Module Documentation

## Overview

The Student module covers two distinct audiences: **admins and teachers**
managing student records, and **students** viewing their own profile,
classes, results, and attendance.

Like [Teachers](teachers.md), student accounts are created exclusively by
an admin — there is no self-registration route for students.

## Access

| Role    | Access                                                                 |
|---------|-----------------------------------------------------------------------|
| ADMIN   | Create, list, view, update, deactivate any student in their school     |
| TEACHER | List/view **only students enrolled in classes the teacher is assigned to teach** |
| STUDENT | View their own profile, classes, results, and attendance               |

A teacher's access to student data is deliberately scoped by their
`TeacherSubject` assignments — a teacher who only teaches SS1 Mathematics
cannot browse or view SS3 students they have no assignment to. This is
enforced in the service layer, not just the route layer: `GET /students`
and `GET /students/:id` are shared routes, but the controller branches
internally based on `req.user.role` and calls a different, narrower
service function for teachers.

## Endpoints

Base path: `/api/v1/students`

| Method | Path              | Access         | Description                                  |
|--------|--------------------|----------------|-------------------------------------------------|
| POST   | `/`                 | ADMIN          | Create a student account                        |
| GET    | `/`                 | ADMIN, TEACHER | List students (scope depends on role — see below) |
| GET    | `/:id`              | ADMIN, TEACHER | Get a single student (scope depends on role)     |
| PUT    | `/:id`              | ADMIN          | Update a student's name/email                    |
| DELETE | `/:id`              | ADMIN          | Deactivate a student (soft delete — see below)   |
| GET    | `/me`               | STUDENT        | The logged-in student's own profile              |
| GET    | `/me/classes`       | STUDENT        | The student's enrolled classes and subjects       |
| GET    | `/me/results`       | STUDENT        | The student's results for a session/term          |
| GET    | `/me/attendance`    | STUDENT        | The student's attendance summary for a session/term |

> As with Teachers, the `/me` routes must be registered before `/:id` in
> the route file, or Express would try to match `"me"` as an `:id`.

### `POST /api/v1/students`

```json
{
  "name": "Amaka Okoro",
  "email": "amaka@student.greenwood.edu",
  "password": "••••••••"
}
```

- Creates a `User` with `role: "STUDENT"`, scoped to the admin's own
  school.
- Password hashed with `bcrypt`; fails with `409 Conflict` if the email is
  already registered.
- Response never includes the password hash — every function in this
  module that returns a `User` uses an explicit safe field selection.

### `GET /api/v1/students`

- **As ADMIN:** returns every student in the school.
- **As TEACHER:** returns only students enrolled in a class the teacher
  has a `TeacherSubject` assignment for. A teacher with no assignments at
  all gets an empty list, not an error.

### `GET /api/v1/students/:id`

- **As ADMIN:** returns any student in the school, or `404` if the ID
  doesn't belong to their school.
- **As TEACHER:** returns the student only if they're enrolled in one of
  the teacher's own class/subject assignments — `404` otherwise, even if
  the student exists elsewhere in the same school. The teacher cannot tell
  from the response whether the student doesn't exist or simply isn't
  theirs to view.

### `PUT /api/v1/students/:id`

Updates `name` and/or `email` only — same restriction as
[Teachers](teachers.md#put-apiv1teachersid): password changes are not
handled through this endpoint. Fails with `409 Conflict` on a duplicate
email.

### `DELETE /api/v1/students/:id`

**This is a soft delete, not a permanent one** — same pattern as
[School deactivation](schools.md#deactivation). It sets `User.isActive`
to `false` rather than deleting the row.

This was a deliberate choice: a student accumulates significant history
over time — `Enrollment`, `Score`, `Attendance`, `Invoice`/`Payment`
(financial records), `PromotionHistory`, `ReportCard`. Permanently
deleting a student would either fail outright (foreign key constraints)
or cascade-delete years of academic and financial history — including
payment records a school may be legally required to retain. Deactivating
preserves everything while removing the student's ability to log in.

#### Deactivation

Once a student's `isActive` is `false`:

- **Login is blocked immediately on their next attempt.** The check
  happens inside `loginUser` (see [Auth — `POST /login`](auth.md)), and
  runs independently of the school-wide `isActive` check — a student can
  be deactivated individually even while their school remains fully
  active, and vice versa.
- **An already-issued JWT is not revoked.** As with school deactivation,
  a student who logged in before being deactivated keeps a valid token
  until it expires (up to 7 days) — `protect` only verifies the token's
  signature and doesn't re-check `isActive` on every request.
- There is currently no reactivation endpoint.

## The Student's own routes (`/me`, `/me/*`)

These all derive identity from `req.user` (the JWT) — a student can never
view another student's data through these routes, regardless of what (if
anything) is in the URL or query string.

### `GET /api/v1/students/me`

Returns the student's own profile, including their school and every
`Enrollment` they've ever had (most recent first), each with its `class`
and `session` attached.

### `GET /api/v1/students/me/classes`

Returns the student's enrollments, each expanded to include the class's
full subject list — and for each subject, which teacher teaches it:

```json
[
  {
    "enrollmentId": "uuid",
    "class": { "id": "uuid", "name": "SS2", ... },
    "session": { "id": "uuid", "name": "2026/2027", "isActive": true, ... },
    "subjects": [
      {
        "id": "uuid", "name": "Mathematics", "code": "MTH", "description": "...",
        "teacher": { "id": "uuid", "name": "Mr. Adewale", "email": "..." }
      }
    ]
  }
]
```

### `GET /api/v1/students/me/results?sessionId=...&termId=...`

Both `sessionId` and `termId` are required query parameters — the request
fails with `400` if either is missing. Delegates to the
[Result module](result.md)'s `getStudentResults`.

### `GET /api/v1/students/me/attendance?sessionId=...&termId=...`

Both `sessionId` and `termId` are required. Returns the student's
enrollment/class/session/term context, plus an attendance summary and the
full record list:

```json
{
  "student": { "id": "uuid", "name": "...", "email": "..." },
  "class": { ... },
  "session": { ... },
  "term": { ... },
  "summary": {
    "totalDays": 45,
    "presentDays": 40,
    "absentDays": 3,
    "lateDays": 1,
    "excusedDays": 1,
    "percentage": 88.89
  },
  "records": [ /* individual Attendance rows, each with subject + teacher */ ]
}
```

Attendance is filtered to records within the requested term's
`startDate`–`endDate` range, and only for the student's own enrollment —
never another student's.

## Validation

`student.validation.js` enforces the same rules as
[Teachers](teachers.md#validation): `name` (min 2 chars), `email` (valid
format), `password` (min 8 chars, create only). Update requests require
at least one of `name`/`email` and never accept `password`.

## Business Rules

- Student accounts are always created by an admin, scoped to the admin's
  own `schoolId` — never self-registered.
- Email uniqueness is enforced across all users, not just students.
- A teacher's visibility into student data is scoped strictly to their
  own `TeacherSubject` assignments.
- Students are never hard-deleted — only deactivated.
- A deactivated student cannot log in, independent of their school's
  active status.

## Related

- [Auth](auth.md) — login, and how individual + school-level deactivation
  both gate access.
- [Teachers](teachers.md) — the equivalent module for teacher accounts,
  including the shared deactivation pattern.
- [Enrollments](enrollments.md) — how a student gets linked to a class and
  session in the first place.
- [Results](result.md), [Attendance](attendance.md) — the data sources
  behind `/me/results` and `/me/attendance`.
- [Invoices](invoices.md) — a student's own billing history
  (`GET /invoices/my`), not covered by this module.
