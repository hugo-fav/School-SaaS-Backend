# Assessment Module Documentation

## Overview

The Assessment Module is responsible for managing academic assessments within the School SaaS platform. It allows administrators and teachers to create, update, publish, unpublish, retrieve, and delete assessments while enforcing strict business rules that maintain data integrity and prevent invalid academic records.

An assessment represents any form of student evaluation such as:

- Assignment
- Quiz
- Continuous Assessment (CA)
- Project
- Practical
- Examination
Each assessment belongs to a specific:

- Academic Session
- Academic Term
- Teacher Assignment (Teacher + Subject + Class)
This ensures every assessment is tied to a teacher teaching a particular subject to a specific class during a particular academic session.

# Assessment Model

| Field | Type | Description |
| --- | --- | --- |
| id | UUID | Unique assessment identifier |
| title | String | Assessment title |
| description | String (Optional) | Assessment description |
| type | AssessmentType | Assessment category |
| maxScore | Float | Maximum obtainable score |
| dueDate | DateTime (Optional) | Submission or examination date |
| isPublished | Boolean | Indicates whether students can access the assessment |
| publishedAt | DateTime (Optional) | Date and time the assessment was published |
| createdAt | DateTime | Record creation timestamp |
| updatedAt | DateTime | Last update timestamp |
| teacherSubjectId | UUID | Linked TeacherSubject |
| termId | UUID | Linked Academic Term |

Relationships

- TeacherSubject (Many-to-One)
- Term (Many-to-One)
- Scores (One-to-Many)

# Assessment Types

The system supports the following assessment categories:

- ASSIGNMENT
- QUIZ
- CA
- PROJECT
- PRACTICAL
- EXAM
The assessment type helps schools classify different forms of evaluation while allowing reports to be grouped appropriately.

# API Endpoints

## Create Assessment

POST

```
/api/v1/assessments
```

### Description

Creates a new assessment.

### Authorized Roles

- ADMIN
- TEACHER

### Business Rules

- Assessment title is required.
- Maximum score must be greater than zero.
- Teacher assignment must exist.
- Teacher assignment must belong to the authenticated user’s school.
- Teacher can only create assessments for subjects assigned to them.
- Academic session must be active.
- Academic term must be active.
- Teacher assignment and term must belong to the same academic session.
- Due date must fall within the selected term.
- Duplicate assessment titles are not allowed within the same teacher assignment and term.

### Successful Response

```
201 Created

```

# Get All Assessments

GET

```
/api/v1/assessments
```

### Description

Returns all assessments belonging to the authenticated school.

### Authorized Roles

- ADMIN
- TEACHER

# Get Assessment By ID

GET

```
/api/v1/assessments/:id
```

### Description

Returns detailed information for a single assessment.

### Authorized Roles

- ADMIN
- TEACHER

### Validation

- Assessment must belong to the authenticated school.

# Update Assessment

PUT

```
/api/v1/assessments/:id
```

### Description

Updates an existing assessment.

### Authorized Roles

- ADMIN
- TEACHER

### Business Rules

Assessment must exist.

Teacher ownership is verified.

If scores already exist:

- Assessment cannot be modified.
If assessment has been published:

Only the following fields may be updated:

- description
- dueDate
The following fields become locked after publication:

- title
- type
- maxScore
- teacher assignment
- academic term
For draft assessments:

- Title must not be empty.
- Maximum score must remain greater than zero.
- Teacher assignment must exist.
- Academic term must exist.
- Teacher assignment and academic term must belong to the same session.
- Academic session must be active.
- Academic term must be active.
- Due date must remain inside the academic term.
- Duplicate titles are prevented.

# Delete Assessment

DELETE

```
/api/v1/assessments/:id
```

### Description

Deletes an assessment.

### Authorized Roles

- ADMIN
- TEACHER

### Business Rules

Assessment must exist.

Teacher ownership is validated.

Assessment cannot be deleted if:

- It has already been published.
- Student scores have already been recorded.

# Publish Assessment

PATCH

```
/api/v1/assessments/:id/publish
```

### Description

Publishes an assessment, making it available for use.

### Authorized Roles

- ADMIN
- TEACHER

### Business Rules

Assessment must exist.

Teacher ownership must be validated.

Assessment must not already be published.

Academic session must be active.

Academic term must be active.

Assessment cannot contain recorded scores.

On success:

```
isPublished = true
publishedAt = current timestamp

```

# Unpublish Assessment

PATCH

```
/api/v1/assessments/:id/unpublish
```

### Description

Returns a published assessment back to draft status.

### Authorized Roles

- ADMIN
- TEACHER

### Business Rules

Assessment must exist.

Teacher ownership must be validated.

Assessment must already be published.

Assessment cannot have recorded scores.

On success:

```
isPublished = false
publishedAt = null

```

# Validation Rules

The Assessment Module enforces the following validations:

### Assessment Title

- Required
- Trimmed before storage
- Cannot be duplicated within the same Teacher Assignment and Academic Term

### Maximum Score

- Must be greater than zero

### Due Date

- Optional
- Must fall within the selected academic term

### Teacher Assignment

Must:

- Exist
- Belong to the authenticated school
- Belong to the authenticated teacher (for TEACHER role)
- Belong to the selected academic session

### Academic Session

Must:

- Exist
- Be active

### Academic Term

Must:

- Exist
- Be active
- Belong to the selected academic session

# Security

The module enforces multi-tenant security by ensuring every operation is scoped to the authenticated user’s school.

Teacher-level authorization ensures teachers can only manage assessments assigned to them.

Administrators have unrestricted access within their own school.

# Helper Functions Used

The module uses reusable helper functions to reduce duplication.

### ensureExists()

Checks that a requested resource exists.

### checkTeacherOwnership()

Ensures teachers can only access resources assigned to them.

### validatePositiveNumber()

Validates that numeric values are greater than zero.

### validateDateWithinRange()

Ensures dates fall within an allowed range.

### createHttpError()

Creates standardized HTTP errors with appropriate status codes and messages.

# Module Flow

```
Authentication
        │
        ▼
Authorization
        │
        ▼
School Validation
        │
        ▼
Teacher Ownership Validation
        │
        ▼
Business Rule Validation
        │
        ▼
Database Transaction
        │
        ▼
Response

```

# Summary

The Assessment Module provides a secure and consistent way to manage academic assessments within the School SaaS platform. It ensures that assessments are always linked to valid teachers, subjects, classes, academic sessions, and terms while enforcing publication workflows, preventing invalid updates, protecting recorded scores, and maintaining strict multi-tenant isolation between schools. The module serves as the foundation for the Score, Report Card, and Student Performance modules that build on top of assessment data.
