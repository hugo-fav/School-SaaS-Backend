# Fee Module Documentation

## Overview

The Fee module lets an admin define what a school charges — for a whole
academic session, a specific term, and optionally a specific class. A `Fee`
is a template ("SS3 exam fee, ₦20,000, Term 2"); it does not itself bill any
individual student. Turning a fee into an actual bill is the responsibility
of the [Invoice module](invoices.md).

See [payments.md](payments.md) for how Fee, Invoice, and Payment relate to
each other conceptually.

## Access

All fee routes require `protect` and are restricted to `authorize("ADMIN")`.
Teachers and students have no direct access to fee management.

## Endpoints

Base path: `/api/v1/fees`

| Method | Path      | Description                          |
|--------|-----------|----------------------------------------|
| POST   | `/`       | Create a new fee                       |
| GET    | `/`       | List all fees for the school           |
| GET    | `/:id`    | Get a single fee (with its invoices)   |
| PUT    | `/:id`    | Update a fee                           |
| DELETE | `/:id`    | Delete a fee                           |

### `POST /api/v1/fees`

Creates a fee. `sessionId` is required; `termId` and `classId` are optional.

```json
{
  "name": "Term 1 Tuition",
  "description": "2026/2027 First Term School Fees",
  "amount": 150000,
  "sessionId": "uuid",
  "termId": "uuid",
  "classId": "uuid"
}
```

- Omitting `termId` means the fee applies across the entire session
  (used by session-wide charges, e.g. a development levy).
- Omitting `classId` means the fee applies to every class in that
  session/term.
- The `sessionId`, `termId`, and `classId` are each validated to actually
  belong to the requesting admin's school before the fee is created.

**Response `201`**
```json
{
  "success": true,
  "data": { "id": "uuid", "name": "Term 1 Tuition", "amount": "150000.00", ... }
}
```

### `GET /api/v1/fees`

Returns every fee belonging to the admin's school, most recent first, with
`session`, `term`, and `class` included.

### `GET /api/v1/fees/:id`

Returns one fee, including its related `invoices` — useful for seeing how
many students have already been billed for this fee.

### `PUT /api/v1/fees/:id`

Partial update — only the fields provided are changed. If `sessionId` and/or
`termId` are both provided, the term is validated against the *new*
session (not the fee's existing one).

### `DELETE /api/v1/fees/:id`

Fails with a `400` if any invoice has already been generated from this fee —
deleting a fee that's already been billed would silently orphan those
invoices' description/amount trail, so this is blocked by design.

## Business Rules

- A fee's `sessionId`, `termId`, and `classId` must always belong to the
  same school as the fee itself.
- `amount` must be positive.
- A fee cannot be deleted once invoices exist for it.

## Related

- [Invoices](invoices.md) — turning a Fee into a student's bill.
- [Payments](payments.md) — collecting money against an invoice.
