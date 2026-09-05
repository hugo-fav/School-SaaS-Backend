# Score Module Documentation

# Overview

The Score module is responsible for recording, managing, updating, retrieving, and deleting students’ assessment scores within the School SaaS platform.

A score represents the mark obtained by a student in a specific assessment. Every score is linked to:

- An Enrollment (Student + Class + Academic Session)
- An Assessment
- The User (Teacher/Admin) who graded the assessment
This module enforces strict business rules to ensure academic integrity by preventing invalid score entries, duplicate records, and unauthorized modifications.

# Database Model

```
model Score {
  id String @id @default(uuid())

  obtainedScore Float

  remark String?

  gradedAt DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  enrollmentId String
  enrollment Enrollment @relation(fields: [enrollmentId], references: [id])

  assessmentId String
  assessment Assessment @relation(fields: [assessmentId], references: [id])

  gradedById String?
  gradedBy User? @relation("ScoreGradedBy", fields: [gradedById], references: [id])

  @@unique([enrollmentId, assessmentId])
}

```

# Relationships

## Score → Enrollment

Many scores belong to one enrollment.

Each enrollment represents one student’s registration in a class during an academic session.

## Score → Assessment

Many scores belong to one assessment.

Each assessment may contain scores for many students.

## Score → User

Each score stores the user who recorded or last updated it.

This provides an audit trail for grading activities.

# Endpoints

## Create Bulk Scores

POST

```
/api/v1/scores
```

### Description

Creates scores for multiple students for a single assessment in one request.

This endpoint is intended for teachers or administrators entering an entire class’s scores.

## Get All Scores

GET

```
/api/v1/scores
```

### Optional Query Parameters

- assessmentId
- studentId
- classId
- teacherId
- termId
- sessionId

### Description

Returns scores filtered according to the supplied query parameters.

If no filters are provided, all scores belonging to the authenticated user’s school are returned.

## Get Score By ID

GET

```
/api/v1/scores/:id
```

### Description

Retrieves one score together with all related information including:

- Student
- Enrollment
- Assessment
- Subject
- Teacher
- Class
- Session
- Term
- Graded By

## Update Score

PUT

```
/api/v1/scores/:id
```

### Description

Updates an existing score.

Allowed fields include:

- obtainedScore
- remark
The system automatically updates:

- gradedAt
- gradedById

## Delete Score

DELETE

```
/api/v1/scores/:id
```

### Description

Deletes an existing score after all authorization and business rule checks have passed.

# Business Rules

## 1. Assessment Must Exist

Scores cannot be recorded for a non-existent assessment.

## 2. Enrollment Must Exist

Every student receiving a score must have a valid enrollment.

## 3. Assessment Must Belong to the School

Users cannot record or modify scores for assessments belonging to another school.

## 4. Enrollment Must Belong to the School

Cross-school score manipulation is not allowed.

## 5. Assessment Must Be Published

Scores may only be entered or modified for published assessments.

## 6. Academic Session Must Be Active

Scores cannot be recorded or edited after the session has ended.

## 7. Academic Term Must Be Active

Scores cannot be recorded or edited after the term has closed.

## 8. Teacher Ownership

Teachers may only manage scores for assessments they own.

Administrators may manage all scores.

## 9. Student Must Belong to Assessment Class

The enrolled student’s class must match the class assigned to the assessment.

## 10. Student Must Belong to Assessment Session

The enrollment session must match the assessment’s academic session.

## 11. Score Validation

The obtained score must satisfy:

- Score ≥ 0
- Score ≤ Assessment Maximum Score
Invalid values are rejected.

## 12. Duplicate Prevention

A student can only receive one score for a particular assessment.

Database constraint:

```
@@unique([enrollmentId, assessmentId])

```

## 13. Audit Trail

Whenever a score is created or updated, the system stores:

- User who graded the score
- Time the score was graded
This ensures accountability.

# Validation Rules

### Assessment

- Must exist
- Must belong to the authenticated school
- Must be published

### Enrollment

- Must exist
- Must belong to the authenticated school
- Must match the assessment’s class
- Must match the assessment’s academic session

### Score

- Cannot exceed assessment maximum
- Cannot be negative

### Bulk Scores

- Enrollment IDs must be unique within the request
- Duplicate score records are rejected

# Authorization

## Administrator

Can:

- Create scores
- View all scores
- Update scores
- Delete scores

## Teacher

Can:

- Manage scores only for assessments they own
- View scores for their own assessments
- Update their own scores
- Delete their own scores

# Response Structure

Successful responses return:

```
{
  "message": "Operation completed successfully",
  "data": {}
}
```
Returned data includes related entities such as:

- Student
- Enrollment
- Assessment
- Teacher
- Subject
- Class
- Session
- Term
- Graded By

# Common Errors

## Assessment Not Found

Returned when the supplied assessment ID does not exist.

## Enrollment Not Found

Returned when one or more enrollment IDs are invalid.

## Assessment Not Published

Returned when attempting to record scores for an unpublished assessment.

## Session Closed

Returned when the academic session is no longer active.

## Term Closed

Returned when the academic term is no longer active.

## Duplicate Score

Returned when a score already exists for the same enrollment and assessment.

## Invalid Score

Returned when the obtained score exceeds the assessment’s maximum score or is negative.

## Unauthorized Teacher

Returned when a teacher attempts to manage another teacher’s assessment.

# Security

The module enforces:

- Multi-tenant isolation using schoolId
- Role-based authorization
- Teacher ownership validation
- Database-level uniqueness constraints
- Referential integrity through Prisma relations
These protections ensure that users can only manage scores within their own school and within their assigned permissions.

# Module Summary

The Score module provides a complete and secure score management system by supporting:

- Bulk score creation
- Score retrieval with filtering
- Single score retrieval
- Score updates
- Score deletion
- Validation of academic rules
- Audit logging
- Multi-tenant security
- Role-based authorization
- Duplicate prevention
- Data integrity through Prisma relationships and constraints
This module serves as the foundation for report cards, grading, student performance analytics, class rankings, and result computation.
