# Enrollment Status Management

## Overview

Every `Enrollment` tracks whether a student's place in a class is
currently active, or has ended through graduation or withdrawal. This
started as a documented gap — the original proposal noted that graduated
or withdrawn students had no way of being distinguished from currently
enrolled ones — and has since been implemented.

## Schema

```prisma
enum EnrollmentStatus {
  ACTIVE
  GRADUATED
  WITHDRAWN
}

model Enrollment {
  // ...existing fields
  status EnrollmentStatus @default(ACTIVE)
  leftAt DateTime?
}
```

Every `Enrollment` defaults to `ACTIVE` on creation (see
[Enrollments](enrollments.md) / [Classes](classes.md)). `leftAt` is `null`
until the enrollment transitions to `GRADUATED` or `WITHDRAWN`, at which
point it's set to the moment that happened.

## How status changes

**Status is never changed directly.** It changes as a side effect of
creating a [`PromotionHistory`](promotion-history.md) record — the single
place in the system that transitions a student between classes, or out of
the school entirely.

```
POST /api/v1/promotion-history
  status: "PROMOTED" | "REPEATED"
    → Enrollment.classId updated to the new class
    → Enrollment.status remains "ACTIVE"

  status: "GRADUATED" | "WITHDRAWN"
    → Enrollment.classId is left untouched (the student's last class
      stays on record — never nulled out)
    → Enrollment.status set to "GRADUATED" or "WITHDRAWN"
    → Enrollment.leftAt set to the current timestamp
```

Both the `PromotionHistory` creation and the `Enrollment` update happen
inside a single database transaction, so a promotion/graduation/withdrawal
can never be half-applied.

`PromotionHistory` records are permanent — there is deliberately no update
or delete endpoint. A promotion, once recorded, is treated the same as a
financial transaction: an audit trail that should never be silently
edited. If a mistake is made, it currently needs to be corrected directly
at the database level; there is no reversal endpoint yet.

## Where status is enforced

| Module | Behavior |
|---|---|
| [Attendance](attendance.md) | `createBulkAttendance` rejects marking attendance for any enrollment that isn't `ACTIVE`. |
| [Scores](scores.md) | `createBulkScores` rejects recording a score for any enrollment that isn't `ACTIVE`. |
| [Classes](classes.md) | `GET /classes/:id/members` only returns `ACTIVE` enrollments by default. Pass `?includeInactive=true` to see the full historical roster, including graduated/withdrawn students. |
| [Teachers](teachers.md) | `GET /students` and `GET /students/:id` (teacher-scoped view) only return students with an `ACTIVE` enrollment in one of the teacher's assigned classes. |

## Where status is intentionally *not* filtered

Admin-facing history and reporting endpoints — `GET /enrollments`,
`GET /attendance`, `GET /scores`, `GET /promotion-history` — do **not**
filter by enrollment status. This is deliberate: an admin producing a
final transcript, or reviewing a withdrawn student's academic record,
needs to see the complete history regardless of the student's current
status. Restricting these by default would make historical record-keeping
harder, which defeats the purpose of keeping the history in the first
place.

## Related

- [Promotion History](promotion-history.md) — the only place enrollment
  status actually changes.
- [Enrollments](enrollments.md) — where an `Enrollment` (always starting
  `ACTIVE`) is first created.
- [Classes](classes.md), [Teachers](teachers.md) — the roster views that
  filter by status.
- [Attendance](attendance.md), [Scores](scores.md) — the record-creation
  flows that are blocked for non-`ACTIVE` enrollments.
