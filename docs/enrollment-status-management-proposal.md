# Future Enhancement: Enrollment Status Management

## Overview

Currently, the Promotion module records a student’s promotion history and updates the student’s class when applicable. However, the system does not yet track whether an enrollment is still active after graduation or withdrawal.

This enhancement will be implemented in a future version of the School SaaS.

## Why This Enhancement Is Needed

At the moment:

- Promoted students are moved to their new class.
- Repeated students remain in the same class.
- Graduated and withdrawn students only have a record in PromotionHistory.
Their Enrollment record remains unchanged, which means they may still appear in:

- Active student lists
- Class rosters
- Attendance pages
- Score entry pages
- Student reports
This is acceptable for the current version but should be improved in a future release.

## Planned Database Changes

### Add an EnrollmentStatus enum

```
enum EnrollmentStatus {
  ACTIVE
  GRADUATED
  WITHDRAWN
}
```

### Update the Enrollment model

```
status EnrollmentStatus @default(ACTIVE)

leftAt DateTime?

```

## Planned Business Logic

### PROMOTED

- Update the student’s class.
- Keep the enrollment status as ACTIVE.

### REPEATED

- Keep the student in the same class.
- Keep the enrollment status as ACTIVE.

### GRADUATED

- Create a PromotionHistory record.
- Update:
```
status = GRADUATED
leftAt = Current Date
```

### WITHDRAWN

- Create a PromotionHistory record.
- Update:
```
status = WITHDRAWN
leftAt = Current Date

```

## Future Query Updates

After this enhancement, modules should only return active students by default.

Example:

- Enrollment
- Attendance
- Scores
- Class Members
- Student Lists
should filter with:

```
where: {
  status: "ACTIVE"
}
```
Administrative reports can optionally include graduated or withdrawn students when needed.

## Benefits

- Prevents graduated students from appearing as active.
- Prevents withdrawn students from receiving attendance or scores.
- Improves reporting accuracy.
- Supports alumni management.
- Supports historical student records without deleting data.
- Provides a scalable foundation for future student lifecycle management.

## Implementation Status

Status: Planned for a future version.

This enhancement will be implemented after the core School SaaS modules are completed and stabilized.
