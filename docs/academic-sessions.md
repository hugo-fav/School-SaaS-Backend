# Academic Session Module Documentation

## Overview

The Academic Session module manages the academic calendar for each school in the School SaaS application.

It ensures that every school maintains a valid academic session structure by enforcing business rules beyond basic CRUD operations.

# Features

- Create Academic Session
- Get All Academic Sessions
- Get Single Academic Session
- Update Academic Session
- Delete Academic Session

# Business Rules

## 1. Session Name Must Be Unique

Each school cannot have two academic sessions with the same name.

### Example

✅ Allowed

- 2025/2026
- 2026/2027
❌ Not Allowed

- 2025/2026
- 2025/2026
If a duplicate name is detected, the API returns:

```
{
  "message": "Academic session already exists."
}

```

## 2. Academic Sessions Cannot Overlap

A school can only have one academic calendar.

Two academic sessions cannot share overlapping dates.

### Example

Existing Session

```
2025/2026

Start:
2025-09-01

End:
2026-07-31
```
Attempting to create:

```
2026 Special

Start:
2026-01-01

End:
2026-12-31
```
will fail because both sessions overlap.

Response:

```
{
  "message": "Academic session dates overlap with an existing session."
}

```

## 3. Only One Active Academic Session

Only one academic session can be active at any time for a school.

When a new session is activated:

- the selected session becomes active
- every other session in the school is automatically deactivated
This is handled inside a Prisma transaction to guarantee data consistency.

## 4. Active Academic Session Cannot Be Deleted

Deleting the currently active academic session is not allowed.

Response:

```
{
  "message": "You cannot delete the active academic session."
}

```

## 5. Active Session Cannot Be Deactivated Directly

The active session cannot simply be marked inactive.

To change the active session:

- Create another academic session (if necessary).
- Activate the new session.
- The previous active session is automatically deactivated.
Attempting to deactivate the only active session returns:

```
{
  "message": "You cannot deactivate the active session. Activate another session first."
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

- Receives HTTP requests
- Validates request data (if applicable)
- Calls service methods
- Returns HTTP responses
Service

Contains all business logic including:

- Duplicate name validation
- Date overlap validation
- Active session management
- Delete restrictions
- Database transactions
Prisma

Handles communication with the PostgreSQL database.

# Transactions

Creating or activating a session uses a Prisma transaction.

Example workflow:

```
Deactivate old active session
        │
        ▼
Create/Update new active session
```
If either operation fails, Prisma automatically rolls back the transaction, ensuring the database remains consistent.

# API Endpoints

## Create Session

```
POST /api/v1/sessions

```

## Get All Sessions

```
GET /api/v1/sessions

```

## Get Single Session

```
GET /api/v1/sessions/:id

```

## Update Session

```
PUT /api/v1/sessions/:id

```

## Delete Session

```
DELETE /api/v1/sessions/:id

```

# Testing Performed

The following scenarios were successfully tested using Postman:

✅ Create academic session

✅ Retrieve all sessions

✅ Retrieve a single session

✅ Prevent duplicate session names

✅ Prevent overlapping academic session dates

✅ Create multiple sessions

✅ Automatically deactivate previous active session when another session is activated

✅ Prevent deactivation of the only active session

✅ Prevent deletion of the active session

✅ Delete an inactive session successfully

# Conclusion

The Academic Session module now provides a robust and production-ready implementation for managing academic sessions in a multi-tenant School SaaS application.

By enforcing business rules at the service layer and using database transactions where appropriate, the module maintains data integrity, prevents inconsistent states, and ensures that each school always has a valid academic calendar.
