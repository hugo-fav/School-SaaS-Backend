# Invoice Module Documentation

## Overview

An Invoice is a specific student's bill, generated from a Fee. Where a
`Fee` says "SS3 exam fee is ₦20,000," an `Invoice` says "*this* SS3
student's enrollment owes ₦20,000, of which ₦0 has been paid." Invoices are
created deliberately by an admin — either one at a time, or for an entire
class at once — rather than automatically on a schedule.

See [payments.md](payments.md) for the conceptual relationship between Fee,
Invoice, and Payment, and [fees.md](fees.md) for how fees are defined.

## Access

| Role    | Access                                                        |
|---------|-----------------------------------------------------------------|
| ADMIN   | Create invoices, generate for a class, list/filter all invoices, view any invoice in their school |
| STUDENT | View their own invoices only (`/my`), and view a single invoice they own |
| TEACHER | No access                                                        |

## Endpoints

Base path: `/api/v1/invoices`

| Method | Path              | Access         | Description                              |
|--------|--------------------|----------------|--------------------------------------------|
| POST   | `/`                 | ADMIN          | Create one invoice for one enrollment      |
| POST   | `/generate-class`   | ADMIN          | Generate invoices for every student in a class |
| GET    | `/`                 | ADMIN          | List/filter all invoices in the school     |
| GET    | `/my`               | STUDENT        | The logged-in student's own invoices       |
| GET    | `/:id`              | ADMIN, STUDENT | A single invoice (ownership-checked for students) |

### `POST /api/v1/invoices`

```json
{
  "feeId": "uuid",
  "enrollmentId": "uuid"
}
```

Validates:
- The fee and enrollment both belong to the requesting admin's school.
- The enrollment's academic session matches the fee's session.
- If the fee is class-specific, the enrollment's class matches.
- An invoice for this exact `(enrollmentId, feeId)` pair doesn't already
  exist — each student is only ever billed once per fee.

### `POST /api/v1/invoices/generate-class`

```json
{
  "feeId": "uuid",
  "classId": "uuid"
}
```

Creates one invoice per enrolled student in the class, for the given fee's
academic session. Students who already have an invoice for this fee are
skipped, not duplicated.

**Response `200`**
```json
{
  "success": true,
  "message": "38 invoice(s) created, 2 skipped",
  "data": {
    "createdCount": 38,
    "skippedCount": 2,
    "createdInvoices": [...],
    "skippedInvoices": [
      { "enrollmentId": "uuid", "studentId": "uuid", "reason": "Invoice already exists" }
    ]
  }
}
```

### `GET /api/v1/invoices`

Admin-only. Supports query filters: `sessionId`, `termId`, `classId`,
`enrollmentId`, `status` (`PENDING`, `PARTIALLY_PAID`, `PAID`, `OVERDUE`,
`CANCELLED`).

### `GET /api/v1/invoices/my`

Returns every invoice tied to the logged-in student's own enrollments,
including each invoice's `fee` (with `session`/`term`/`class`) and its
`payments` history.

### `GET /api/v1/invoices/:id`

Returns one invoice with its `fee`, `payments`, and `enrollment` (including
student and class). A student who requests an invoice they don't own
receives `403 Forbidden`, even if the invoice belongs to their own school.

## Invoice Status Lifecycle

```
PENDING → PARTIALLY_PAID → PAID
   │
   └──→ CANCELLED  (invoice is voided; no further payment accepted)
```

`amountPaid` and `status` are never updated directly through this module —
they're only ever changed by `applyPaymentToInvoice()`, called from the
[Payment module](payments.md), inside a single database transaction that
also marks the corresponding `Payment` as `SUCCESS`. This keeps invoice
math and payment confirmation atomic — one can never happen without the
other.

## Related

- [Fees](fees.md) — defines what an invoice is generated from.
- [Payments](payments.md) — collecting money against an invoice and the
  webhook that confirms it.
