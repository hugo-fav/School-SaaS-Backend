# School SaaS Backend

A multi-tenant backend API for managing schools — academic sessions, classes,
students, teachers, attendance, results, and fee/invoice/payment collection —
built to serve multiple independent schools from a single deployment.

**Repository:** https://github.com/hugo-fav/School-SaaS-Backend
**Live deployment:** Not yet deployed.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Authentication & Authorization](#authentication--authorization)
- [Multi-Tenancy Model](#multi-tenancy-model)
- [Modules](#modules)
- [API Base URL](#api-base-url)
- [License](#license)

---

## Overview

School SaaS Backend is a REST API that allows multiple schools ("tenants")
to independently manage:

- Academic sessions, terms, classes, and subjects
- Students, teachers, and their enrollments
- Attendance, assessments, scores, and report cards
- Promotion history between classes
- School fees, invoices, and online payment collection via Paystack

Each school's data is isolated from every other school's — a core design
principle carried through every module (see
[Multi-Tenancy Model](#multi-tenancy-model)).

## Tech Stack

| Layer      | Technology                                                                                                                          |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Runtime    | Node.js (ESM — `"type": "module"`)                                                                                                  |
| Framework  | Express                                                                                                                             |
| Database   | PostgreSQL                                                                                                                          |
| ORM        | Prisma                                                                                                                              |
| Validation | Joi                                                                                                                                 |
| Auth       | JWT — `protect` middleware verifies `Authorization: Bearer <token>` and attaches the decoded `{ id, schoolId, role }` to `req.user` |
| Payments   | Paystack (bring-your-own-keys per school, encrypted at rest with AES-256-GCM)                                                       |

## Architecture

The project follows a **modular, feature-based structure**. Each domain
(e.g. `classes`, `fees`, `invoices`, `payments`) is a self-contained folder
with its own route, controller, service, and validation files:

```
modules/<domain>/
  <domain>.route.js        # Express routes + middleware wiring
  <domain>.controller.js   # HTTP layer: request in, response out
  <domain>.service.js      # Business logic, Prisma calls
  <domain>.validation.js   # Joi schemas for request validation
```

**Layering convention:**

```
Route → protect (auth) → authorize (role check) → validate (Joi) → Controller → Service → Prisma
```

Services never know about `req`/`res`; controllers never contain business
logic or direct Prisma calls beyond what's needed to pass data through.
This keeps each layer independently testable and swappable.

## Project Structure

```
school-saas-backend/
├── config/
│   └── prisma.js              # Shared Prisma client instance
├── middlewares/
│   ├── auth.middleware.js     # protect — verifies the logged-in user
│   └── authorization.middleware.js  # authorize(...roles) — role gating
├── modules/
│   ├── academic-sessions/
│   ├── assessments/
│   ├── attendance/
│   ├── auth/
│   ├── classes/
│   ├── enrollments/
│   ├── fees/
│   ├── invoices/
│   ├── payments/
│   ├── promotion-history/
│   ├── report-card/
│   ├── result/
│   ├── schools/
│   ├── scores/
│   ├── students/
│   ├── subjects/
│   ├── teachers/
│   ├── teacherSubjects/
│   └── terms/
├── prisma/
│   └── schema.prisma
├── utils/
│   └── crypto.js               # AES-256-GCM encrypt/decrypt for secrets at rest
├── docs/                        # Per-module documentation (see below)
├── app.js
└── package.json
```

## Getting Started

### Prerequisites

- Node.js (LTS recommended)
- PostgreSQL database
- A Paystack account (test mode is fine for development) — one per school
  that wants to accept payments

### Installation

```bash
git clone https://github.com/hugo-fav/School-SaaS-Backend.git
cd School-SaaS-Backend
npm install
```

### Environment setup

Copy `.env.example` to `.env` (create one if it doesn't exist yet) and fill
in the values described in [Environment Variables](#environment-variables).

### Database setup

```bash
npx prisma migrate dev
npx prisma generate
```

### Run the server

```bash
npm run dev
```

> **Assumption:** a `dev` script exists in `package.json` (e.g. via
> `nodemon`). Update this if your actual start command differs.

## Environment Variables

| Variable         | Description                                                                                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`   | PostgreSQL connection string                                                                                                                                  |
| `ENCRYPTION_KEY` | 32-byte hex key used to encrypt school Paystack secret keys at rest. Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `JWT_SECRET`     | Secret used to sign/verify auth tokens _(assumption — confirm)_                                                                                               |
| `PORT`           | Port the server listens on _(assumption — confirm)_                                                                                                           |

**Never commit `.env` to version control.** Confirm it's listed in
`.gitignore` before your first push.

## Authentication & Authorization

- `protect` — verifies the requester is logged in and attaches `req.user`
  (`id`, `email`, `role`, `schoolId`).
- `authorize(...roles)` — restricts a route to one or more roles:
  `ADMIN`, `TEACHER`, `STUDENT`.

Every route in the project applies both, except the Paystack webhook route
(`POST /api/v1/payments/webhook`), which is authenticated differently — see
[docs/payments.md](docs/payments.md).

## Multi-Tenancy Model

Every school's data is isolated by `schoolId`. The convention followed
throughout every service function is:

- Never trust a `schoolId` from the request body or query string.
- Always derive `schoolId` from `req.user.schoolId` (the authenticated
  user's own school).
- Every Prisma lookup that fetches a record by ID also filters by
  `schoolId` (directly, or via a relation chain), so one school can never
  read or modify another school's data — even by guessing a valid ID.

Where a resource belongs to an individual (e.g. a student's own invoice),
an additional ownership check is applied on top of the tenant check.

## Modules

Detailed documentation for each module lives in [`docs/`](docs/):

| Module                               | Docs                                                                                       | Status |
| ------------------------------------ | ------------------------------------------------------------------------------------------ | ------ |
| Auth                                 | [`docs/auth.md`](docs/auth.md)                                                             | ✅     |
| Schools                              | [`docs/schools.md`](docs/schools.md)                                                       | ✅     |
| Students                             | [`docs/students.md`](docs/students.md)                                                     | ✅     |
| Teachers                             | [`docs/teachers.md`](docs/teachers.md)                                                     | ✅     |
| Classes                              | [`docs/classes.md`](docs/classes.md)                                                       | ✅     |
| Subjects                             | [`docs/subjects.md`](docs/subjects.md)                                                     | ✅     |
| Academic Sessions                    | [`docs/academic-sessions.md`](docs/academic-sessions.md)                                   | ✅     |
| Terms                                | [`docs/terms.md`](docs/terms.md)                                                           | ✅     |
| Teacher Subjects                     | [`docs/teacher-subjects.md`](docs/teacher-subjects.md)                                     | ✅     |
| Enrollments                          | [`docs/enrollments.md`](docs/enrollments.md)                                               | ✅     |
| Enrollment Status Management         | [`docs/enrollment-status.md`](docs/enrollment-status.md)                                   | ✅     |
| Assessments                          | [`docs/assessments.md`](docs/assessments.md)                                               | ✅     |
| Attendance                           | [`docs/attendance.md`](docs/attendance.md)                                                 | ✅     |
| Student Attendance Feature           | [`docs/student-attendance-feature.md`](docs/student-attendance-feature.md)                 | ✅     |
| Scores                               | [`docs/scores.md`](docs/scores.md)                                                         | ✅     |
| Promotion History                    | [`docs/promotion-history.md`](docs/promotion-history.md)                                   | ✅     |
| Report Cards                         | [`docs/report-card.md`](docs/report-card.md)                                               | ✅     |
| Report Card & Attendance Integration | [`docs/report-card-attendance-integration.md`](docs/report-card-attendance-integration.md) | ✅     |
| Results                              | [`docs/result.md`](docs/result.md)                                                         | ✅     |
| **Fees**                             | [`docs/fees.md`](docs/fees.md)                                                             | ✅ New |
| **Invoices**                         | [`docs/invoices.md`](docs/invoices.md)                                                     | ✅ New |
| **Payments** (incl. webhook)         | [`docs/payments.md`](docs/payments.md)                                                     | ✅     |

> Auth, Schools, Students, Teachers, and Classes have all been documented
> above. Everything in this table has been converted from the original
> Word docs or newly written to match the implementation.

## API Base URL

All routes are prefixed with:

```
/api/v1
```

For example: `POST /api/v1/payments/initialize`.
