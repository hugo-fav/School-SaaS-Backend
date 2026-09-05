# School Module Documentation

## Overview

The School module lets an admin view and manage their own school's
profile and payment configuration. A school itself is never created here —
it's created as a side effect of `POST /auth/register` (see
[Auth](auth.md)) — and there is no endpoint to list or view schools other
than your own.

## Access

Every route in this module requires `protect` and `authorize("ADMIN")`.
Teachers and students have no access to school-level settings.

## Endpoints

Base path: `/api/v1/schools`

| Method | Path                | Description                                     |
|--------|----------------------|---------------------------------------------------|
| GET    | `/me`                | Get the logged-in admin's own school               |
| PUT    | `/me`                | Update the school's name                           |
| DELETE | `/me`                | Deactivate the school (soft delete — see below)     |
| PUT    | `/payment-settings`  | Connect/update the school's Paystack keys          |

There is deliberately no `GET /schools` (list all schools) or `POST
/schools` (create a school) endpoint, and no `:id`-based routes. Since an
admin can only ever act on their own school, a URL parameter for the
school ID would be redundant — the server already knows which school the
request belongs to from the JWT (`req.user.schoolId`).

### `GET /api/v1/schools/me`

Returns the admin's own school record.

### `PUT /api/v1/schools/me`

```json
{ "name": "Greenwood International School" }
```

Updates the school's name. `name` is required and must be at least 2
characters.

### `DELETE /api/v1/schools/me`

**This is a soft delete, not a permanent one.** It does not remove the
`School` row or anything connected to it (users, classes, fees, invoices,
payments). It only sets `isActive: false` on the school.

A hard delete was deliberately avoided here: a `School` has cascading
relationships to years of student, teacher, financial, and academic
records. A permanent delete either fails outright (foreign key
constraints) or — if cascades are configured — destroys an entire school's
history in one irreversible request. Soft-deleting keeps all data intact
and recoverable.

#### Deactivation

Once `isActive` is `false`:

- **Login is blocked for every user in that school** — see
  [Auth — `POST /login`](auth.md). The check happens inside `loginUser`,
  after password verification, so a deactivated school's users get a
  `403 Forbidden` even with fully correct credentials.
- **Existing sessions are not immediately revoked.** A user who logged in
  *before* deactivation keeps a valid JWT for up to 7 days (the token's
  expiry — see [Auth — The JWT](auth.md#the-jwt)), since `protect` only
  verifies the token's signature and does not re-check `School.isActive`
  on every request. Deactivation takes effect on next login, not
  mid-session. Enforcing instant lockout would require looking up the
  user's school on every authenticated request across the entire app — a
  meaningful performance cost that hasn't been taken on for this feature
  yet.
- There is currently no "reactivate" endpoint — flipping `isActive` back
  to `true` would need to be done directly in the database, or a
  reactivation route added later if needed.

### `PUT /api/v1/schools/payment-settings`

```json
{
  "paystackSecretKey": "sk_test_xxxxxxxx",
  "paystackPublicKey": "pk_test_xxxxxxxx"
}
```

Connects (or updates) the school's own Paystack account, used for
collecting student fee payments — see [Payments](payments.md) for the
full payment flow this enables.

- `paystackSecretKey` is encrypted with AES-256-GCM before being stored
  (see [README — Environment Variables](../README.md#environment-variables)
  for the `ENCRYPTION_KEY` this depends on). It is **never** returned in
  any response, including this one.
- `paystackPublicKey` is not sensitive and is returned normally — it's
  used by frontend Paystack integrations.
- **Known gap:** the submitted secret key is not verified against
  Paystack before saving. A mistyped or invalid key won't be caught until
  the school's first real payment attempt fails. A stronger version of
  this endpoint would call Paystack's API (e.g. fetch the bank list) to
  confirm the key actually works before persisting it — this has not been
  implemented yet.

**Response `200`**
```json
{
  "success": true,
  "message": "Payment settings updated successfully",
  "data": {
    "id": "uuid",
    "name": "Greenwood International School",
    "paystackPublicKey": "pk_test_xxxxxxxx",
    "createdAt": "..."
  }
}
```

## Business Rules

- A school is created exclusively via `/auth/register`; there is no
  standalone "create school" endpoint.
- An admin can only ever read/modify their own school — enforced by
  scoping every query to `req.user.schoolId`, never a client-supplied ID.
- Deleting a school never destroys data — it deactivates the school and
  blocks future logins for its users instead.

## Related

- [Auth](auth.md) — school creation, and how `isActive` blocks login.
- [Payments](payments.md) — how the connected Paystack keys are used to
  collect fee payments.
