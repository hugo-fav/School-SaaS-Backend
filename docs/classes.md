# Class Module Documentation

## Overview

The Class module manages a school's classes (e.g. "JSS1A", "SS2") as
standalone entities: creating them, listing them, and viewing who's in
them. It deliberately does **not** manage teacher assignment — that
responsibility belongs entirely to the
[Teacher Subjects module](teacher-subjects.md), since in this schema a
teacher is linked to a class *through a subject* (`TeacherSubject`), not
directly. There is no concept of "the" teacher of a class.

> **Note on this module's history:** an earlier version of this module's
> code referenced a `Class.teacherId`, a `Class.students` many-to-many,
> and a `User.taughtClasses` relation — none of which exist in the actual
> Prisma schema. That code could not run against the real schema and has
> been fully rewritten to use `Enrollment` (student↔class) and
> `TeacherSubject` (teacher↔subject↔class), consistent with every other
> module in this project. If you're referencing old notes or a stale
> `dist/` build for this module, discard them.

## Access

| Role    | Access                                                              |
|---------|-------------------------------------------------------------------|
| ADMIN   | Create, list, view, update, delete classes; enroll students        |
| TEACHER | View a single class and its members (read-only)                    |
| STUDENT | No direct access                                                   |

## Endpoints

Base path: `/api/v1/classes`

| Method | Path                        | Access         | Description                              |
|--------|------------------------------|----------------|---------------------------------------------|
| POST   | `/`                          | ADMIN          | Create a class                              |
| GET    | `/`                          | ADMIN          | List all classes in the school               |
| GET    | `/:id`                       | ADMIN, TEACHER | Get a single class                          |
| PUT    | `/:id`                       | ADMIN          | Update a class's name                       |
| DELETE | `/:id`                       | ADMIN          | Delete a class                              |
| POST   | `/:classId/enroll-student`   | ADMIN          | Enroll a student into the class for a session |
| GET    | `/:id/members`               | ADMIN, TEACHER | View a class's enrolled students and teacher/subject assignments |

### `POST /api/v1/classes`

```json
{ "name": "JSS1A" }
```

### `GET /api/v1/classes`

Returns every class belonging to the admin's school.

### `GET /api/v1/classes/:id`

Returns a single class, or `404` if it doesn't exist or belongs to a
different school.

### `PUT /api/v1/classes/:id`

```json
{ "name": "JSS1B" }
```

### `DELETE /api/v1/classes/:id`

Blocked with `409 Conflict` if the class still has any `Enrollment` or
`TeacherSubject` records pointing to it. This prevents orphaning student
enrollments, scores, attendance, and teacher assignments tied to the
class. Move or remove those first before a class can be deleted.

### `POST /api/v1/classes/:classId/enroll-student`

```json
{
  "studentId": "uuid",
  "sessionId": "uuid"
}
```

This is a thin convenience wrapper — it does not implement its own
enrollment logic. It calls the [Enrollments module](enrollments.md)'s
`createEnrollment` directly, passing `classId` from the URL and
`studentId`/`sessionId` from the body. This means every rule enforced by
Enrollments applies here too, unchanged:

- The student and session must belong to the same school as the class.
- The session must be the currently **active** academic session — you
  cannot enroll a student into a class under a past or future session.
- A student can only have one enrollment per academic session (enrolling
  them again, even into a different class, fails with `400` if they
  already have an enrollment for that session — use
  [`PUT /enrollments/:id`](enrollments.md) to move a student between
  classes instead).

There is intentionally only one place that creates an `Enrollment` — this
endpoint does not duplicate that logic, so a future change to enrollment
rules (e.g. a new eligibility check) only needs to be made once, in
Enrollments, and automatically applies here too.

### `GET /api/v1/classes/:id/members?sessionId=...`

Returns the class with two things attached:

- **`enrollments`** — every student enrolled in the class, each with
  their `student` details and `session`. Optionally filtered to one
  session via the `sessionId` query parameter (e.g. to see only this
  year's roster, not every student who's ever passed through the class).
- **`teacherSubjects`** — every teacher/subject assignment for the class
  (who teaches what), also optionally filtered by `sessionId`.

```json
{
  "message": "Class details fetched",
  "data": {
    "id": "uuid",
    "name": "JSS1A",
    "enrollments": [
      {
        "id": "enrollmentId",
        "student": { "id": "uuid", "name": "...", "email": "..." },
        "session": { "id": "uuid", "name": "2026/2027", "isActive": true }
      }
    ],
    "teacherSubjects": [
      {
        "id": "uuid",
        "teacher": { "id": "uuid", "name": "...", "email": "..." },
        "subject": { "id": "uuid", "name": "Mathematics", "code": "MTH" }
      }
    ]
  }
}
```

Without `sessionId`, this returns members across **every** session the
class has ever had — useful for an admin's historical view, but likely
not what you want for a "who's in this class right now" screen; pass the
active session's ID for that.

## Validation

`class.validation.js` enforces:

| Endpoint                  | Rules                                            |
|----------------------------|---------------------------------------------------|
| Create/update class        | `name` — required, non-empty string                |
| Enroll student              | `studentId`, `sessionId` — both required, valid UUIDs |

## Business Rules

- A class always belongs to exactly one school, set from the admin's own
  token — never client-supplied.
- Teacher assignment is entirely out of scope for this module — see
  [Teacher Subjects](teacher-subjects.md).
- A class cannot be deleted while it has active enrollments or teacher
  assignments.
- Student enrollment logic is owned exclusively by the
  [Enrollments module](enrollments.md); this module only exposes a
  convenience route that calls into it.

## Related

- [Teacher Subjects](teacher-subjects.md) — how teachers get connected to
  a class (via subject), and where a class's teaching assignments are
  actually managed.
- [Enrollments](enrollments.md) — the module that owns all enrollment
  creation, update, and deletion rules.
- [Academic Sessions](academic-sessions.md) — enrollments and teacher
  assignments are both session-scoped; only the active session accepts
  new ones.
- [Fees](fees.md) — a `Fee` can optionally be scoped to a specific class.
