# Term Module Documentation

## Overview

The Term Module manages academic terms within an academic session in the School SaaS application.

Each term belongs to a specific academic session and follows strict business rules to ensure the academic calendar remains valid and consistent.

The module is implemented using a Service Layer Architecture, where all business logic resides in the service layer while controllers remain lightweight.

# Features

- Create Term
- Get All Terms
- Get Single Term
- Update Term
- Delete Term

# Business Rules

## 1. A Term Must Belong to an Academic Session

A term cannot exist independently.

Every term must reference an existing academic session.

Example:

```
Academic Session
2026/2027

├── First Term
├── Second Term
└── Third Term
```
If the supplied academic session does not exist, the API returns:

```
{
  "message": "Academic session not found."
}

```

## 2. Only Valid Academic Term Names Are Allowed

To maintain consistency across schools, only the following names are accepted:

- First Term
- Second Term
- Third Term
Any other value is rejected.

Example:

❌ Invalid

- Holiday
- Summer
- Fourth Term
- Test Term
Response:

```
{
  "message": "Invalid term name. Term must be First Term, Second Term or Third Term."
}

```

## 3. Maximum of Three Terms Per Academic Session

An academic session can only contain three terms.

Example:

```
2026/2027

✓ First Term
✓ Second Term
✓ Third Term

✗ Fourth Term
```
Response:

```
{
  "message": "An academic session cannot have more than three terms."
}

```

## 4. Term Names Must Be Unique Within an Academic Session

The same academic session cannot contain duplicate term names.

Example:

```
2026/2027

✓ First Term
✓ Second Term
✓ Third Term

✗ First Term
```
Response:

```
{
  "message": "Term already exists."
}

```

## 5. Term Dates Must Fall Within the Academic Session

A term’s start and end dates must be completely contained within its parent academic session.

Example

Academic Session

```
Start
2026-09-01

End
2027-07-31
```
Valid Term

```
First Term

Start
2026-09-01

End
2026-12-15
```
Invalid Term

```
Start
2026-08-01
```
Response:

```
{
  "message": "Term dates must fall within the academic session."
}

```

## 6. Term Dates Cannot Overlap

Two terms within the same academic session cannot overlap.

Example

```
First Term

Sep → Dec

Second Term

Dec → Mar
```
If the second term begins before the first term ends, the request is rejected.

Response:

```
{
  "message": "Term dates overlap with another term."
}

```

## 7. Only One Active Term Per Academic Session

Only one term can be active at any given time.

When a term is activated:

- It becomes the active term.
- Every other active term within the same academic session is automatically deactivated.
This operation is performed inside a Prisma transaction to maintain consistency.

## 8. Active Term Cannot Be Deleted

Deleting the currently active term is prohibited.

Response:

```
{
  "message": "You cannot delete the active term."
}

```

## 9. Active Term Cannot Be Deactivated Directly

The active term cannot simply be marked inactive.

To change the active term:

- Activate another term.
- The previously active term is automatically deactivated.
Attempting to deactivate the only active term returns:

```
{
  "message": "You cannot deactivate the active term. Activate another term first."
}

```

# Architecture

The module follows the Service Layer Architecture.

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

### Responsibilities

Controller

- Receives HTTP requests.
- Calls the appropriate service.
- Returns HTTP responses.
Service

Contains all business logic, including:

- Academic session validation.
- Term name validation.
- Duplicate checks.
- Maximum term validation.
- Date validation.
- Overlap detection.
- Active term management.
- Delete restrictions.
- Database transactions.
Prisma

Handles communication with the PostgreSQL database.

# Transactions

Creating and activating terms are executed inside Prisma transactions.

Workflow:

```
Deactivate existing active term
          │
          ▼
Create or Update selected term
```
If any operation fails, Prisma automatically rolls back the transaction to preserve data integrity.

# API Endpoints

## Create Term

```
POST /api/v1/terms

```

## Get All Terms

```
GET /api/v1/terms

```

## Get Single Term

```
GET /api/v1/terms/:id

```

## Update Term

```
PUT /api/v1/terms/:id

```

## Delete Term

```
DELETE /api/v1/terms/:id

```

# Testing Performed

The following scenarios were successfully tested using Postman:

- ✅ Create term
- ✅ Retrieve all terms
- ✅ Retrieve a single term
- ✅ Prevent duplicate term names
- ✅ Restrict invalid term names
- ✅ Prevent creation of more than three terms
- ✅ Prevent overlapping term dates
- ✅ Ensure term dates remain within the academic session
- ✅ Activate a different term and automatically deactivate the previous active term
- ✅ Prevent direct deactivation of the active term
- ✅ Prevent deletion of the active term
- ✅ Delete inactive term successfully

# Conclusion

The Term Module provides a reliable and production-ready solution for managing academic terms within the School SaaS platform.

By enforcing strict business rules through the service layer and using database transactions for critical operations, the module guarantees data consistency, preserves academic calendar integrity, and ensures that each academic session maintains a valid term structure.

This module also serves as the foundation for subsequent academic components such as Subjects, TeacherSubject assignments, Assessments, Scores, Attendance, and Report Cards.
