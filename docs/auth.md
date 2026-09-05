# Auth Module Documentation

## Overview

The Auth module handles account creation and login for the School SaaS
platform. Registering through this module creates a new **School** and its
first **ADMIN** user in a single step — there is no separate "create a
school" endpoint; a school comes into existence as a side effect of an
admin signing up.

There is currently no self-service registration route for teachers or
students — those accounts are created by an admin through the
[Students](students.md) / [Teachers](teachers.md) modules (see those docs
once written), not through `/auth/register`.

## Endpoints

Base path: `/api/v1/auth`

| Method | Path        | Access | Description                                  |
|--------|-------------|--------|-----------------------------------------------|
| POST   | `/register` | Public | Create a new school and its admin account     |
| POST   | `/login`    | Public | Authenticate and receive a JWT                |

### `POST /api/v1/auth/register`

```json
{
  "name": "Jane Doe",
  "email": "jane@greenwood.edu",
  "password": "••••••••",
  "schoolName": "Greenwood International School"
}
```

- Creates a `School` row (`name: schoolName`) and a `User` row in the same
  operation, linking the new user to the new school.
- The created user's `role` is always `ADMIN` — this is not a
  client-controlled field. Registration is exclusively how a school's
  first administrator account is created; there is no way to self-register
  as `TEACHER` or `STUDENT` through this endpoint.
- Passwords are hashed with `bcrypt` (10 salt rounds) before being stored —
  the plaintext password is never persisted.
- If the email is already registered, the request fails with `409
  Conflict` rather than a raw database error.

**Response `201`**
```json
{
  "message": "User created successfully",
  "data": {
    "id": "uuid",
    "name": "Jane Doe",
    "email": "jane@greenwood.edu",
    "role": "ADMIN",
    "school": { "id": "uuid", "name": "Greenwood International School", "createdAt": "..." }
  }
}
```

### `POST /api/v1/auth/login`

```json
{
  "email": "jane@greenwood.edu",
  "password": "••••••••"
}
```

- Looks up the user by email and compares the supplied password against
  the stored bcrypt hash.
- If the password matches, two deactivation checks run, in order:
  1. **Individual account** — if `User.isActive` is `false` for this
     specific user, login is rejected with `403 Forbidden`, regardless of
     the school's status. See
     [Students — Deactivation](students.md#deactivation).
  2. **School-wide** — if the user's school has been deactivated
     (`School.isActive` is `false`), login is rejected with
     `403 Forbidden` even if the individual account is active. See
     [Schools — Deactivation](schools.md#deactivation).
- On success, returns the user's profile (**with the password hash
  stripped out** — never sent to the client) — including the nested
  `school` object — and a signed JWT.
- Invalid email and invalid password both return the same response
  (`401 Invalid credentials`), so a failed login attempt can't be used to
  determine whether a given email is registered.

**Response `200`**
```json
{
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "name": "Jane Doe",
    "email": "jane@greenwood.edu",
    "role": "ADMIN",
    "schoolId": "uuid",
    "createdAt": "...",
    "updatedAt": "..."
  },
  "token": "eyJhbGciOi..."
}
```

## The JWT

Tokens are signed with `JWT_SECRET` (see [README — Environment
Variables](../README.md#environment-variables)) and expire after **7 days**.

The token payload contains exactly:

```json
{
  "id": "uuid",       // the user's id
  "schoolId": "uuid",  // which school this user belongs to
  "role": "ADMIN | TEACHER | STUDENT"
}
```

This is the shape every other module in the project relies on. The
`protect` middleware verifies the token and attaches this decoded payload
to `req.user`, so `req.user.id`, `req.user.schoolId`, and `req.user.role`
are available in every authenticated route across the app — this is the
single source of truth for that contract.

## How other modules use `req.user`

- **`schoolId`** — used everywhere to scope a request to the caller's own
  school (see [README — Multi-Tenancy Model](../README.md#multi-tenancy-model)).
  Never trusted from the request body/query string; always read from the
  token.
- **`role`** — used by the `authorize(...roles)` middleware to restrict
  routes (e.g. `authorize("ADMIN")`), and inside some controllers to branch
  behavior (e.g. a student seeing only their own invoices — see
  [Invoices](invoices.md)).
- **`id`** — used for ownership checks, e.g. confirming a student is only
  viewing/paying their own invoice (see [Payments](payments.md)).

## Security Notes

- Passwords are never returned in any API response, including login.
- The bcrypt cost factor is 10 rounds.
- `JWT_SECRET` must be a strong, unpredictable value and must never be
  committed to version control (see the root [README](../README.md)).
- There is currently no rate limiting or account lockout on `/login`. This
  is worth adding before production launch, to reduce exposure to
  brute-force password guessing.
- There is currently no email verification or password-reset flow.

## Related

- [Multi-Tenancy Model](../README.md#multi-tenancy-model) — how `schoolId`
  from the token is used to isolate each school's data.
- [Schools](schools.md) *(not yet documented)*
- [Teachers](teachers.md) *(not yet documented)* — teacher accounts are
  **not** created through `/auth/register`. An admin creates/invites
  teacher accounts for their own school; this keeps `/auth/register`
  exclusively meaning "create a new school," and prevents anyone from
  joining an existing school just by knowing its `schoolId`.
