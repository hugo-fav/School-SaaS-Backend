# Promotion History Module Documentation

## Overview

The Promotion History module manages the academic progression of students within the School SaaS. It records every promotion decision made for a student’s enrollment, ensuring that promotions become part of the student’s permanent academic history.

Unlike regular CRUD resources, Promotion History serves as an audit trail. Once a promotion has been recorded, it should remain immutable to preserve historical integrity.

# Purpose

The module enables administrators to:

- Promote students to a higher class.
- Repeat students in their current class.
- Record students who have graduated.
- Record students who have withdrawn.
- Maintain a complete historical record of every promotion decision.
- Automatically update a student’s current class when promotion or repetition occurs.

# Business Rules

## General Rules

- Only users with the ADMIN role can promote students.
- Promotions can only occur after the academic session has ended.
- Each enrollment can only have one promotion history record.
- The enrollment must belong to the authenticated user’s school.

## Promotion Statuses

The module supports the following promotion statuses:

### PROMOTED

The student moves to a different class.

Requirements:

- Destination class is required.
- Destination class must be different from the current class.
- Student enrollment is automatically updated to the new class.

### REPEATED

The student remains in the same class.

Requirements:

- Destination class is required.
- Destination class must be the same as the student’s current class.
- Enrollment remains in the same class.

### GRADUATED

The student completes the academic program.

Requirements:

- No destination class is allowed.
Future Enhancement:

- Mark enrollment as GRADUATED.
- Prevent further attendance and score records.

### WITHDRAWN

The student leaves the school.

Requirements:

- No destination class is allowed.
Future Enhancement:

- Mark enrollment as WITHDRAWN.
- Prevent further academic activities.

# Automatic Enrollment Update

For the following statuses:

- PROMOTED
- REPEATED
The system automatically updates the student’s enrollment.

Example:

Before Promotion

```
Student: John Doe
Class: JSS1B
```
Promotion

```
Status: PROMOTED
Destination Class: JSS2A
```
After Promotion

```
Student: John Doe
Class: JSS2A

```

# Validation Rules

The module validates the following:

- Enrollment ID is required.
- Promotion status is required.
- Enrollment must exist.
- Enrollment must belong to the authenticated school.
- Academic session must have ended.
- Only administrators may perform promotions.
- Duplicate promotion records are not allowed.
- Promotion status must be valid.
- Destination class must exist.
- Destination class must belong to the authenticated school.

# API Endpoints

## Create Promotion History

POST

```
/api/v1/promotion-history
```
Creates a new promotion record.

### Request Body

Promoted Student

```
{
  "enrollmentId": "uuid",
  "toClassId": "uuid",
  "status": "PROMOTED",
  "remark": "Passed all subjects successfully"
}
```
Repeated Student

```
{
  "enrollmentId": "uuid",
  "toClassId": "uuid",
  "status": "REPEATED",
  "remark": "Needs improvement"
}
```
Graduated Student

```
{
  "enrollmentId": "uuid",
  "status": "GRADUATED",
  "remark": "Completed all academic requirements"
}
```
Withdrawn Student

```
{
  "enrollmentId": "uuid",
  "status": "WITHDRAWN",
  "remark": "Transferred to another school"
}

```

## Get Promotion History

GET

```
/api/v1/promotion-history
```
Returns all promotion history records belonging to the authenticated school.

### Supported Query Parameters

| Parameter | Description |
| --- | --- |
| studentId | Filter by student |
| fromClassId | Filter by previous class |
| toClassId | Filter by destination class |
| sessionId | Filter by academic session |
| status | Filter by promotion status |

Example

```
GET /api/v1/promotion-history?status=PROMOTED

```

## Get Promotion History By ID

GET

```
/api/v1/promotion-history/:id
```
Returns a single promotion history record.

# Response Data

Each promotion record includes:

- Promotion information
- Student enrollment
- Student details
- Academic session
- Previous class
- Destination class
- Administrator who performed the promotion

# Security

All endpoints require authentication.

Authorization:

- ADMIN
Teachers and students cannot create promotion records.

# Database Relationships

PromotionHistory

- belongs to Enrollment
- belongs to From Class
- belongs to Destination Class
- belongs to Administrator (Promoted By)
Enrollment

- belongs to Student
- belongs to Class
- belongs to Session

# Current Features

- Create promotion history
- Get all promotion history
- Get promotion history by ID
- Automatic enrollment update
- Duplicate promotion prevention
- School-level isolation
- Session validation
- Administrator authorization
- Promotion status validation
- Complete audit trail

# Future Enhancements

The following features are planned for future releases:

## Enrollment Status

Add an EnrollmentStatus enum:

- ACTIVE
- GRADUATED
- WITHDRAWN
This will prevent graduated or withdrawn students from appearing in active academic processes.

## Promotion Reversal

Instead of editing or deleting promotion history, provide a controlled reversal workflow to correct mistakes while preserving historical records.

## Notifications

Automatically notify:

- Students
- Parents
- Teachers
when promotion decisions are finalized.

## Report Card Integration

Promotion history will integrate with the Report Card module to determine whether a student:

- Advances to the next class
- Repeats the current class
- Graduates
- Withdraws

# Design Decision

The Promotion History module is designed as an immutable audit log.

For this reason, the API intentionally provides only the following endpoints:

- Create Promotion History
- Get All Promotion History
- Get Promotion History By ID
Update and Delete operations are intentionally omitted to preserve the integrity and authenticity of academic records.
