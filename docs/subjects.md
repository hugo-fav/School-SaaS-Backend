# Subject Module Documentation

## Overview

The Subject Module manages all academic subjects within a school in the School SaaS application.

A subject represents a course or discipline that can later be assigned to teachers, classes, assessments, and student scores.

Each subject belongs to a specific school, ensuring complete tenant isolation in the multi-tenant architecture.

The module follows the Service Layer Architecture, where controllers are responsible only for handling HTTP requests and responses, while all business logic resides in the service layer.

# Features

- Create Subject
- Get All Subjects
- Get Single Subject
- Update Subject
- Delete Subject

# Business Rules

## 1. Every Subject Belongs to One School

A subject cannot exist independently.

Each subject is associated with a single school through the schoolId foreign key.

Example:

```
School A
├── Mathematics
├── English Language
└── Physics

School B
├── Mathematics
└── Biology
```
The same subject name can exist in different schools because each school manages its own academic records independently.

## 2. Subject Names Must Be Unique Within a School

A school cannot create two subjects with the same name.

Example:

```
School A

✓ Mathematics
✓ English Language

✗ Mathematics
```
Response:

```
{
  "message": "Subject already exists."
}
```
This rule is enforced by both:

- Service layer validation.
- Prisma database constraint:
```
@@unique([schoolId, name])

```

## 3. Subject Name Is Required

Every subject must have a valid name.

Creating or updating a subject without a name is not allowed.

Example:

```
{
  "name": ""
}
```
Response:

```
{
  "message": "Subject name is required."
}

```

## 4. Subject Belongs Only to Its School

Administrators can only access subjects that belong to their own school.

Every query is filtered using the authenticated user’s schoolId.

Example:

```
where: {
    schoolId: req.user.schoolId
}
```
This guarantees complete data isolation between schools.

## 5. Subject Can Be Updated

Administrators can update:

- Subject name
- Subject code
- Subject description
Before updating, the system validates:

- Subject exists.
- Updated name does not duplicate another subject within the same school.

## 6. Subject Cannot Be Deleted When Assigned

A subject cannot be deleted if it has already been assigned to one or more teachers.

The service checks existing teacher assignments before deletion.

Example:

```
Mathematics

Assigned to:

✓ Mr. John
✓ Mrs. Grace
```
Attempting to delete the subject returns:

```
{
  "message": "Cannot delete subject because it has teacher assignments."
}
```
This prevents orphaned records and preserves referential integrity.

# Architecture

The Subject Module follows the Service Layer Architecture.

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

## Responsibilities

### Controller

The controller is responsible for:

- Receiving HTTP requests.
- Calling the appropriate service.
- Returning HTTP responses.
No business logic is implemented in the controller.

### Service

The service contains all business logic, including:

- Duplicate subject validation.
- School ownership validation.
- CRUD operations.
- Delete restrictions.
- Data integrity checks.

### Prisma ORM

Prisma handles communication with the PostgreSQL database.

It is responsible for:

- Creating records.
- Fetching records.
- Updating records.
- Deleting records.
- Enforcing database constraints.

# API Endpoints

## Create Subject

```
POST /api/v1/subjects
```
Creates a new subject for the authenticated user’s school.

## Get All Subjects

```
GET /api/v1/subjects
```
Returns all subjects belonging to the authenticated user’s school.

Subjects are ordered alphabetically by name.

## Get Single Subject

```
GET /api/v1/subjects/:id
```
Returns details of a specific subject, including any related teacher assignments if available.

## Update Subject

```
PUT /api/v1/subjects/:id
```
Updates an existing subject.

Supported fields include:

- Name
- Code
- Description

## Delete Subject

```
DELETE /api/v1/subjects/:id
```
Deletes a subject if it has no teacher assignments.

# Security

The Subject Module enforces strict tenant isolation.

Every request is filtered using the authenticated administrator’s schoolId.

This prevents administrators from:

- Viewing another school’s subjects.
- Updating another school’s subjects.
- Deleting another school’s subjects.

# Testing Performed

The following scenarios were successfully tested using Postman:

- ✅ Create subject
- ✅ Retrieve all subjects
- ✅ Retrieve a single subject
- ✅ Update subject
- ✅ Delete subject
- ✅ Prevent duplicate subject names
- ✅ Validate required subject name
- ✅ Enforce school-level data isolation
- ✅ Return 404 for non-existent subjects
The deletion restriction for subjects with teacher assignments will be fully validated after implementing the TeacherSubject module.

# Conclusion

The Subject Module provides a secure and scalable way to manage academic subjects within each school.

By enforcing school-level isolation, validating duplicate names, and preventing deletion of subjects that are already assigned to teachers, the module maintains data consistency and supports future academic features.

This module serves as the foundation for:

- TeacherSubject assignments
- Assessments
- Scores
- Report Cards
- Academic analytics
Its design aligns with the overall architecture of the School SaaS platform and ensures reliable subject management across multiple schools.
