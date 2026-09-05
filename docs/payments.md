# School SaaS — Payment Module Documentation

## 1. Overview

The Payment module is responsible for handling student payments for school fees and other invoices through Paystack.

The payment system is designed around the following relationship:

```
School
   │
   ├── Payment Provider Settings
   │       ├── Paystack Public Key
   │       └── Paystack Secret Key
   │
   ├── Fees
   │       │
   │       └── Invoices
   │               │
   │               └── Payments
   │
   └── Students
           │
           └── Enrollments
                   │
                   └── Invoices
```
The Payment module does not create fees or invoices itself.

Instead:

- The Fee module defines what a student owes.
- The Invoice module creates an actual bill for a student.
- The Payment module allows the student to pay that invoice.
- Paystack processes the actual payment.
- The Webhook module receives confirmation from Paystack.
- The Invoice module is updated when payment succeeds.

# 2. Main Modules Involved

The payment system depends on several modules.

| Module | Responsibility |
| --- | --- |
| School | Stores Paystack configuration |
| Auth | Authenticates users and provides user identity |
| Student | Provides student information |
| Enrollment | Connects students to classes and sessions |
| Fee | Defines fees students are expected to pay |
| Invoice | Creates and tracks individual student bills |
| Payment | Initializes and verifies payments |
| Webhook | Receives payment events from Paystack |
| Paystack | External payment provider |

# 3. Relationship Between Fee, Invoice and Payment

The most important concept in the payment system is the distinction between a Fee, an Invoice, and a Payment.

## Fee

A Fee represents a charge created by the school.

Example:

```
Name: School Fees
Description: 2026/2027 First Term School Fees
Amount: ₦150,000
Session: 2026/2027
Term: First Term
Class: JSS2A
```
A fee does not necessarily belong to one student.

It can apply to an entire class.

For example:

```
School Fees
     │
     └── JSS2A
          │
          ├── Student A
          ├── Student B
          ├── Student C
          └── Student D

```

# 4. Invoice

An Invoice is the student’s actual bill generated from a Fee.

For example:

```
Fee
School Fees
₦150,000
     │
     ↓
Invoice for Student
     │
     ├── Invoice Number
     ├── Student
     ├── Amount
     ├── Amount Paid
     └── Status
```
An invoice belongs to:

- one student enrollment
- one fee
The Invoice model therefore connects the Fee and Enrollment.

```
Fee
 │
 └──── Invoice ──── Enrollment
                         │
                         └── Student

```

# 5. Payment

A Payment represents an attempt to pay an invoice through the payment provider.

For example:

```
Invoice
Amount: ₦150,000
Amount Paid: ₦0
Status: PENDING
        │
        ↓
Student initializes payment
        │
        ↓
Paystack
        │
        ↓
Payment
Status: SUCCESS
Amount: ₦150,000
        │
        ↓
Invoice
Amount Paid: ₦150,000
Status: PAID
```
A Payment belongs to:

- one Invoice
- one School
The Payment stores information about the external transaction.

Important fields include:

```
id
reference
amount
status
provider
providerTransactionId
paidAt
invoiceId
schoolId

```

# 6. School and Payment Provider

Because this is a SaaS application, each school can have its own payment configuration.

The School model contains:

```
paystackPublicKey
paystackSecretKey
```
The public key can be returned to clients when necessary.

The secret key must remain protected.

The secret key is encrypted before being stored in the database.

The encryption utility uses:

```
AES-256-GCM
```
The encrypted value contains:

```
IV : Auth Tag : Encrypted Data
```
The secret key is decrypted only when the backend needs to communicate with Paystack.

# 7. Authentication and Authorization

Payment routes use the authentication middleware:

```
protect
```
The middleware reads the JWT from:

```
Authorization: Bearer <token>
```
After verification:

```
req.user = decoded;
```
The decoded token contains:

```
{
  id,
  schoolId,
  role
}
```
This information is important because the payment system must know:

- Which user is making the request.
- Which school the user belongs to.
- What role the user has.

# 8. Payment Roles

## Student

Students can:

- initialize payment for their own invoice
- verify their payment
- view their invoices
- view their payment history
Students must not be able to:

- create fees
- create invoices
- generate class invoices
- access another student’s invoice
- modify payment records

## Admin

Administrators can:

- manage school payment settings
- view invoices
- view payments
- verify payments
- manage fees and invoices

## Teacher

Teachers currently do not have payment access.

# 9. Payment Routes

The Payment module exposes the following routes.

## Initialize Payment

```
POST /api/v1/payments/initialize
```
Access:

```
STUDENT
```
Middleware:

```
protect
authorize("STUDENT")
validateInitializePayment
```
The student supplies the invoice information required by the validation schema.

The backend:

- authenticates the student
- confirms the invoice exists
- confirms the invoice belongs to the student
- confirms the school
- checks the school’s Paystack configuration
- creates a payment record
- generates a unique payment reference
- initializes the transaction with Paystack
- returns the Paystack authorization URL
Example response:

```
{
  "success": true,
  "message": "Payment initialized successfully",
  "data": {
    "paymentId": "3d6dd34e-877b-42c5-8eef-99490ef922a7",
    "reference": "PAY-MTBO4P8B-YFDTW8WW",
    "authorizationUrl": "https://checkout.paystack.com/...",
    "accessCode": "..."
  }
}
```
The frontend uses the authorizationUrl to send the student to Paystack checkout.

# 10. Payment Initialization Flow

```
Student
   │
   │ POST /payments/initialize
   ↓
Auth Middleware
   │
   ↓
Authorization
   │
   ↓
Payment Controller
   │
   ↓
Payment Service
   │
   ├── Find Invoice
   │
   ├── Validate Student Ownership
   │
   ├── Find School
   │
   ├── Decrypt Paystack Secret Key
   │
   ├── Create Payment Record
   │
   └── Call Paystack
   │
   ↓
Paystack
   │
   ↓
Authorization URL
   │
   ↓
Student

```

# 11. Paystack Amount Conversion

The application stores monetary amounts in Naira.

For example:

```
₦1,000
```
Paystack expects amounts in kobo.

Therefore:

```
₦1,000 × 100 = 100,000 kobo
```
The payment service converts the amount before sending it to Paystack.

When Paystack sends the amount back, the backend validates it against the expected invoice/payment amount.

# 12. Payment Verification

Route:

```
GET /api/v1/payments/verify/:reference
```
Access:

```
ADMIN
STUDENT
```
Middleware:

```
protect
authorize("ADMIN", "STUDENT")
validateVerifyPayment
```
The reference comes from the Payment record.

Example:

```
GET /api/v1/payments/verify/PAY-MTBO4P8B-YFDTW8WW
```
The backend:

- finds the payment using the reference
- checks ownership where required
- finds the school
- decrypts the Paystack secret key
- calls Paystack’s verification endpoint
- checks the transaction status
- updates the payment when successful
- updates the invoice
- returns the payment result

# 13. Successful Payment Flow

When payment succeeds:

```
Paystack
   │
   ↓
Payment Verification / Webhook
   │
   ↓
Payment
status = SUCCESS
   │
   ↓
Invoice
amountPaid += payment.amount
   │
   ↓
Invoice status
   │
   ├── PENDING
   ├── PARTIALLY_PAID
   └── PAID
```
For a fully paid invoice:

```
Invoice amount:     ₦1,000
Amount paid:        ₦1,000
Remaining balance:  ₦0
Status:             PAID

```

# 14. Webhook Module

The application also receives payment notifications directly from Paystack.

Route:

```
POST /api/v1/payments/webhook
```
Unlike normal authenticated API routes, the webhook does not use the application’s JWT authentication.

Instead, Paystack authenticates the request using:

```
x-paystack-signature
```
The backend also requires the raw request body to verify the signature.

The application therefore configures Express JSON parsing with:

```
express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  },
});

```

# 15. Webhook Security

The webhook calculates an HMAC SHA-512 hash using the school’s Paystack secret key.

Conceptually:

```
HMAC-SHA512(
    Paystack Secret Key,
    Raw Request Body
)
```
The resulting hash is compared with:

```
x-paystack-signature
```
If they do not match:

```
401 Invalid Paystack signature
```
This prevents unauthorized requests from pretending to be Paystack.

# 16. Webhook Processing

The webhook currently processes:

```
charge.success
```
Other Paystack events are acknowledged without modifying the payment.

The flow is:

```
Paystack
   │
   │ charge.success
   ↓
Webhook Route
   │
   ↓
Webhook Controller
   │
   ├── Get signature
   ├── Get reference
   ├── Find Payment
   ├── Find School
   ├── Decrypt Secret Key
   ├── Verify Signature
   ├── Verify Event
   ├── Validate Reference
   ├── Validate Amount
   │
   ↓
applyPaymentToInvoice()
   │
   ├── Update Payment
   │
   └── Update Invoice

```

# 17. applyPaymentToInvoice()

The function:

```
applyPaymentToInvoice()
```
is responsible for the database-side application of a successful payment.

It is located in the Invoice service because updating an invoice’s financial state is primarily an invoice operation.

The Payment service and Webhook controller can therefore call the same function.

This prevents duplicated payment-to-invoice logic.

# 18. Database Transaction

applyPaymentToInvoice() uses:

```
prisma.$transaction()
```
This ensures the payment and invoice updates happen together.

The operation performs:

```
Find Payment
      ↓
Validate Payment
      ↓
Find Invoice
      ↓
Validate Invoice
      ↓
Calculate Amount Paid
      ↓
Update Invoice
      ↓
Update Payment
```
If an error occurs during the transaction, Prisma rolls back the transaction.

# 19. Duplicate Payment Protection

The system contains protection against processing the same successful payment more than once.

Before applying the payment:

```
if (payment.status === "SUCCESS")
```
the service recognizes that the payment has already been processed.

This is important because payment providers can retry webhook requests.

For example:

```
Webhook #1
    ↓
Payment SUCCESS
Invoice PAID

Webhook #2
    ↓
Same Payment
    ↓
Already processed
    ↓
No second charge applied
```
This prevents:

```
₦1,000
+
₦1,000
=
₦2,000
```
from being incorrectly added to a ₦1,000 invoice.

# 20. Invoice Status

The invoice status represents the current financial state of the invoice.

The expected states are:

```
PENDING
PARTIALLY_PAID
PAID
```
The calculation is based on:

```
amount
amountPaid
```
For example:

### Pending

```
Invoice:     ₦150,000
Paid:        ₦0
Status:      PENDING
```

### Partially Paid

```
Invoice:     ₦150,000
Paid:        ₦50,000
Balance:     ₦100,000
Status:      PARTIALLY_PAID
```

### Fully Paid

```
Invoice:     ₦150,000
Paid:        ₦150,000
Balance:     ₦0
Status:      PAID

```

# 21. Invoice-to-Payment Relationship

An invoice can have multiple payment records.

This is important for future support for partial payments.

Example:

```
Invoice
₦150,000
   │
   ├── Payment #1 → ₦50,000
   │
   ├── Payment #2 → ₦50,000
   │
   └── Payment #3 → ₦50,000
```
The invoice can therefore maintain:

```
amount = ₦150,000
amountPaid = ₦150,000
status = PAID
```
while preserving the individual payment history.

# 22. How the Modules Connect

## School → Payment

The School module stores the school’s Paystack configuration.

```
School
 ├── paystackPublicKey
 └── paystackSecretKey
```
The Payment module uses this information when communicating with Paystack.

## Fee → Invoice

The Fee module defines the amount that should be charged.

The Invoice module converts that fee into a student-specific bill.

```
Fee
 │
 ├── sessionId
 ├── termId
 ├── classId
 └── amount
       │
       ↓
Invoice

```

## Enrollment → Invoice

Enrollment identifies the student, class and academic session.

```
Enrollment
 ├── studentId
 ├── classId
 └── sessionId
       │
       ↓
Invoice
```
This allows the system to determine exactly which student owes the invoice.

## Invoice → Payment

Payment references the invoice:

```
Payment.invoiceId
        ↓
Invoice.id
```
Therefore, the backend always knows which invoice a payment belongs to.

## Student → Payment

The student initiates payment for an invoice.

The backend uses:

```
req.user.id
```
to ensure the student can only initiate payment for their own invoice.

## Paystack → Payment

Paystack processes the actual financial transaction.

The Payment record stores:

```
reference
provider
providerTransactionId
status
paidAt
```
This creates a link between the application’s payment record and Paystack’s transaction.

# 23. Complete End-to-End Architecture

```
SCHOOL
                           │
                  Paystack Configuration
                           │
                           ▼
                       FEE MODULE
                           │
                    Creates a Fee
                           │
                           ▼
                    INVOICE MODULE
                           │
                  Creates Student Invoice
                           │
                           ▼
                       STUDENT
                           │
                 Initialize Payment
                           │
                           ▼
                    PAYMENT MODULE
                           │
                           ├──────────────┐
                           │              │
                           ▼              ▼
                      PAYSTACK       Payment Record
                           │
                           │
                      Student Pays
                           │
                           ▼
                    PAYSTACK WEBHOOK
                           │
                           ▼
                 Signature Verification
                           │
                           ▼
                 Payment Validation
                           │
                           ▼
              applyPaymentToInvoice()
                           │
                    ┌──────┴──────┐
                    ▼             ▼
                PAYMENT        INVOICE
                SUCCESS       PAID/PARTIAL
                    │             │
                    └──────┬──────┘
                           ▼
                     PAYMENT HISTORY

```

# 24. Current API Structure

```
/api/v1
│
├── /auth
│
├── /schools
│
├── /students
│
├── /teachers
│
├── /classes
│
├── /sessions
│
├── /terms
│
├── /subjects
│
├── /enrollments
│
├── /fees
│
├── /invoices
│
└── /payments
      │
      ├── POST /initialize
      │
      ├── GET /verify/:reference
      │
      └── POST /webhook

```

# 25. Important Security Rules

The Payment module must follow these rules:

### 1. Never expose the Paystack secret key

The secret key should never be returned in an API response.

### 2. Never expose user passwords

Student responses must not include the password field.

### 3. Always authenticate payment API requests

Student and admin payment operations must use:

```
protect
```

### 4. Enforce role authorization

Use:

```
authorize("STUDENT")
```
or:

```
authorize("ADMIN", "STUDENT")
```
where appropriate.

### 5. Verify school ownership

A user must not access another school’s invoices or payments.

### 6. Verify student ownership

Students must only access and pay their own invoices.

### 7. Verify webhook signatures

Never trust a webhook simply because it came to the webhook endpoint.

### 8. Validate payment amounts

The amount received from Paystack must correspond to the payment/invoice amount.

### 9. Prevent duplicate processing

The same successful transaction must not update an invoice more than once.

# 26. Current Payment Lifecycle

The current system follows this lifecycle:

```
PENDING
   │
   │ Student initializes payment
   ▼
Paystack Checkout
   │
   ├── Payment abandoned/failed
   │       │
   │       └── Payment remains unsuccessful
   │
   └── Payment successful
           │
           ▼
       SUCCESS
           │
           ▼
      Apply to Invoice
           │
           ├── Partial payment
           │       ↓
           │   PARTIALLY_PAID
           │
           └── Full payment
                   ↓
                 PAID

```

# 27. Design Principle

The key architectural principle is:

> Payment records the transaction; Invoice records the student’s financial obligation.

The Payment module should not independently decide the invoice’s financial state.

Instead:

```
Payment
   ↓
applyPaymentToInvoice()
   ↓
Invoice
```
This keeps the financial logic centralized and makes the system easier to maintain.

# 28. Summary

The School SaaS payment architecture connects:

```
School
   ↓
Fee
   ↓
Invoice
   ↓
Payment
   ↓
Paystack
   ↓
Webhook
   ↓
Payment + Invoice Update
```
The most important relationships are:

```
School 1 ──── * Fee
School 1 ──── * Invoice/Payment
Fee    1 ──── * Invoice
Enrollment 1 ──── * Invoice
Invoice 1 ──── * Payment
Student 1 ──── * Enrollment
```
The architecture separates responsibilities:

- School → payment provider configuration
- Fee → defines what should be charged
- Enrollment → identifies the student
- Invoice → represents what the student owes
- Payment → represents the transaction
- Paystack → processes the money
- Webhook → confirms Paystack events
- Invoice service → applies successful payments to invoices
- Auth/Authorization → controls who can perform each operation
This structure provides the foundation for expanding the payment system with partial payments, payment history, refunds, receipts, payment reports, and an administrative financial dashboard.
