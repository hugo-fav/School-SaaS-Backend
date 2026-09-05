# Teacher Module Documentation

## Overview

The Teacher module covers two things: how an **admin** creates and manages
teacher accounts for their school, and how a **teacher** views their own
profile, class/subject assignments, and the students in those classes.

Teacher accounts are created exclusively by an admin through this module —
not through `/auth/register`. See [Auth — Related](auth.md#related) for why
self-registration into an existing school is deliberately not supported.

## Access

| Role    | Access                                                                 |
|---------|---------------------------------------------------------------------------|
| ADMIN   | Create, list, view, update, delete teacher accounts in their own school    |
| TEACHER | View their own profile, classes, students, and subject assignments        |
| STUDENT | No access                                                                  |

## Endpoints

Base path: `/api/v1/teachers`

| Method | Path                                       | Access  | Description                                      |
|--------|----------------------------------------------|---------|-----------------------------------------------------|
| POST   | `/`                                          | ADMIN   | Create a teacher account                            |
| GET    | `/`                                          | ADMIN   | List all teachers in the school                     |
| GET    | `/:id`                                       | ADMIN   | Get a single teacher                                |
| PUT    | `/:id`                                       | ADMIN   | Update a teacher's name/email                       |
| DELETE | `/:id`                                       | ADMIN   | Delete a teacher                                    |
| GET    | `/me`                                        | TEACHER | The logged-in teacher's own profile                 |
| GET    | `/my-classes`                                | TEACHER | Classes/subjects the teacher is assigned to          |
| GET    | `/my-students`                               | TEACHER | Students in the teacher's assigned classes           |
| GET    | `/my-subjects`                               | TEACHER | Subjects the teacher is assigned to teach             |
| GET    | `/my-subjects/:teacherSubjectId/students`     | TEACHER | Students under one specific subject assignment        |

> Note the ordering in the actual route file: the `/me`, `/my-*` routes are
> registered **before** `/:id`. This matters in Express — `/:id` is a
> wildcard and would otherwise swallow requests to `/me` as if `"me"` were
> an ID.

### `POST /api/v1/teachers`

```json
{
  "name": "Mr. Adewale",
  "email": "adewale@greenwood.edu",
  "password": "••••••••"
}
```

- Creates a `User` with `role: "TEACHER"`, scoped to the admin's own
  `schoolId` — the school is never taken from the request body.
- Password is hashed with `bcrypt` before storage.
- Fails with `409 Conflict` if the email is already registered to any
  account (admin, teacher, or student).
- **Password hash is never included in the response** — every function in
  this module that returns a `User` explicitly selects a safe field set
  (`id`, `name`, `email`, `role`, `schoolId`, `createdAt`, `updatedAt`).

**Response `201`**
```json
{
  "message": "Teacher created successfully",
  "data": {
    "id": "uuid",
    "name": "Mr. Adewale",
    "email": "adewale@greenwood.edu",
    "role": "TEACHER",
    "schoolId": "uuid",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

### `GET /api/v1/teachers`

Returns every user with `role: "TEACHER"` in the admin's school.

### `GET /api/v1/teachers/:id`

Returns `404` if the teacher doesn't exist or belongs to a different
school — the two cases are deliberately indistinguishable in the response,
so an admin can't use this endpoint to probe for the existence of accounts
outside their own school.

### `PUT /api/v1/teachers/:id`

Updates `name` and/or `email` only. **This endpoint cannot change a
teacher's password** — that's intentional; a password change made by
someone other than the account owner belongs in a dedicated reset/invite
flow, not a generic profile-update endpoint. Fails with `409 Conflict` if
the new email is already in use by another account.

Because this uses `updateMany` under the hood (needed to combine the
`schoolId` tenant check into a single query), the response does not
include the updated record — only a success message. If you need the
updated teacher's data back, follow up with `GET /:id`.

### `DELETE /api/v1/teachers/:id`

Blocked with `409 Conflict` if the teacher still has any `TeacherSubject`
assignments (i.e. they're currently assigned to teach a subject in a
class). This mirrors the same protective pattern used in
[`Fee` deletion](fees.md) — deleting a teacher who has active assignments
would otherwise orphan (or cascade-delete, depending on schema
configuration) their assessments and attendance records. Remove the
teacher's subject assignments first, then delete the account.

## Teacher's own routes (`/me`, `/my-*`)

These all read `req.user.id` and `req.user.schoolId` from the JWT — a
teacher can only ever see their own data through these routes, never
another teacher's, regardless of what (if anything) is passed in the URL.

### `GET /api/v1/teachers/me`

Returns the logged-in teacher's own profile (safe fields only).

### `GET /api/v1/teachers/my-classes`

Returns the teacher's `TeacherSubject` assignments, each with its `class`,
`subject`, and `session` attached — i.e. "every class/subject/session
combination this teacher currently teaches."

### `GET /api/v1/teachers/my-students`

**Not a flat list of students.** Each entry in the response is one of the
teacher's subject assignments, expanded to include the class and every
student enrolled in it:

```json
{
  "message": "Teacher's students fetched successfully",
  "data": [
    {
      "id": "teacherSubjectId",
      "subject": { "id": "uuid", "name": "Mathematics", ... },
      "session": { "id": "uuid", "name": "2026/2027", ... },
      "class": {
        "id": "uuid",
        "name": "SS2",
        "enrollments": [
          { "id": "enrollmentId", "student": { "id": "uuid", "name": "...", "email": "..." } }
        ]
      }
    }
  ]
}
```

If a teacher teaches the same class for two different subjects, that class
(and its student list) appears twice — once per subject assignment — since
the grouping is by `TeacherSubject`, not by class.

### `GET /api/v1/teachers/my-subjects`

Similar shape to `/my-classes`, but oriented around subjects: each
`TeacherSubject` assignment with `subject`, `class`, and `session` details
attached, sorted alphabetically by subject name.

### `GET /api/v1/teachers/my-subjects/:teacherSubjectId/students`

Returns the students for **one specific** subject assignment. Returns
`404` if the `teacherSubjectId` doesn't exist, or exists but belongs to a
different teacher, or a different school — all three cases return the same
"not found or you are not assigned to it" message, again to avoid leaking
which case actually applied.

**Response shape:**
```json
{
  "message": "Teacher subject students fetched successfully",
  "results": 32,
  "data": {
    "teacherSubject": { "id": "uuid", "subject": {...}, "class": {...}, "session": {...} },
    "students": [
      { "enrollmentId": "uuid", "student": { "id": "uuid", "name": "...", "email": "..." } }
    ]
  }
}
```

## Validation

`teacher.validation.js` enforces:

| Field      | Rule                                  |
|------------|------------------------------------------|
| `name`     | string, min 2 characters, required (create) |
| `email`    | valid email format, required (create)    |
| `password` | min 8 characters, required (create only) |

Update requests accept `name` and/or `email` (at least one required) —
`password` is not accepted by the update schema at all.

## Business Rules

- A teacher account always belongs to exactly one school (`schoolId`),
  set from the creating admin's own token — never client-supplied.
- Email uniqueness is enforced across **all** users (admins, teachers,
  students share one `email` uniqueness constraint), not just within
  teachers.
- A teacher cannot be deleted while they still have `TeacherSubject`
  assignments.
- Teachers have no payment-related access anywhere in the system (see
  [Payments — Access](payments.md#access)).

## Related

- [Auth](auth.md) — why teacher accounts aren't created via self-registration.
- [Teacher Subjects](teacher-subjects.md) — how a teacher gets assigned to a
  class/subject in the first place.
- [Attendance](attendance.md), [Scores](scores.md), [Assessments](assessments.md)
  — modules where a teacher's `TeacherSubject` assignment is used to scope
  what they can mark/grade.
