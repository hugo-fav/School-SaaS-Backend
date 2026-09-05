# Report Card Module Documentation

## 1. Overview

The Report Card module manages the complete lifecycle of student report cards within the School SaaS backend.

It allows authorized users to:

- Generate a report card for a student.
- Retrieve a student’s report card.
- Retrieve report cards for an entire class.
- Add teacher remarks.
- Add principal remarks.
- Publish a report card.
- Allow students to view their published report cards.
- Calculate and display subject grades.
- Calculate the student’s overall average.
- Determine class position.
- Display attendance information where applicable.
The module is tenant-aware, meaning report-card data is restricted to the authenticated user’s school.

# 2. Report Card Lifecycle

A report card follows this general workflow:

```
Student Results
      ↓
Generate Report Card
      ↓
Calculate Average
      ↓
Calculate Overall Grade
      ↓
Determine Class Position
      ↓
Add Teacher Remark
      ↓
Add Principal Remark
      ↓
Publish Report Card
      ↓
Student Views Published Report Card
```
A newly generated report card starts with:

```
published = false
publishedAt = null
teacherRemark = null
principalRemark = null
```
After publication:

```
published = true
publishedAt = <date>
```
Once published, the report card cannot be modified.

# 3. Database Model

The main Prisma model is:

```
model ReportCard {
  id String @id @default(uuid())

  enrollmentId String
  enrollment   Enrollment @relation(fields: [enrollmentId], references: [id])

  termId String
  term   Term   @relation(fields: [termId], references: [id])

  average  Float
  position Int

  overallGrade  String
  overallRemark String

  teacherRemark   String?
  principalRemark String?

  published   Boolean   @default(false)
  publishedAt DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([enrollmentId, termId])
}
```

## Important fields

### enrollmentId

Identifies the student’s enrollment for the academic session and class.

The report card is connected to the student through the enrollment.

### termId

Identifies the academic term for which the report card was generated.

### average

The student’s overall percentage average.

Example:

```
70
```

### position

The student’s position in the class.

Example:

```
1
```

### overallGrade

The overall grade calculated from the student’s average.

Example:

```
A
```

### overallRemark

The overall remark associated with the grade.

Example:

```
Excellent
```

### teacherRemark

Optional until the teacher adds a remark.

### principalRemark

Optional until the principal/admin adds a remark.

### published

Controls whether the report card has been officially released.

### publishedAt

Stores the date and time the report card was published.

# 4. Unique Constraint

The following constraint prevents generating multiple report cards for the same student and term:

```
@@unique([enrollmentId, termId])
```
Therefore:

```
Student + Enrollment + Term
```
can only have one report card.

If an attempt is made to generate another report card for the same enrollment and term, the API returns:

```
Report card has already been generated.

```

# 5. Grading System

The grading system currently uses:

```
const gradingScale = [
  { min: 70, grade: "A", remark: "Excellent" },
  { min: 60, grade: "B", remark: "Very Good" },
  { min: 50, grade: "C", remark: "Good" },
  { min: 45, grade: "D", remark: "Fair" },
  { min: 40, grade: "E", remark: "Pass" },
  { min: 0, grade: "F", remark: "Fail" },
];
```
The grade is determined by the student’s percentage.

For example:

```
70% → A → Excellent
60% → B → Very Good
50% → C → Good
45% → D → Fair
40% → E → Pass
Below 40% → F → Fail
```
The helper function is:

```
const getGrade = (percentage) => {
  return gradingScale.find(({ min }) => percentage >= min);
};

export default getGrade;
```
Because the grading scale is ordered from highest to lowest, the first matching grade is returned.

# 6. Authentication

All report-card endpoints are protected by JWT authentication.

The authentication middleware:

```
protect
```
decodes the token and attaches the authenticated user to:

```
req.user
```
A decoded student token looks like:

```
{
  id: "b2a90a64-8ee7-4dde-914b-6c7d927bfe62",
  schoolId: "54f73a96-a787-478e-9926-6cadf531b719",
  role: "STUDENT",
  iat: "...",
  exp: "..."
}
```
The important values are:

```
id
schoolId
role
```
These are used for authentication, authorization, and school-level data isolation.

# 7. Authorization

The module uses role-based authorization.

### ADMIN

Can:

- Generate report cards.
- View report cards.
- Add teacher remarks.
- Add principal remarks.
- Publish report cards.
- View class report cards.

### TEACHER

Can:

- View report cards.
- Add teacher remarks.
- View class report cards.

### STUDENT

Can:

- View their own published report card.
Students cannot:

- Generate report cards.
- Modify remarks.
- Publish report cards.
- View another student’s report card through the student endpoint.

# 8. Routes

The report-card router is:

```
router.post(
  "/generate",
  protect,
  authorize("ADMIN"),
  asyncHandler(reportCardController.generateReportCard),
);

router.get(
  "/:studentId",
  protect,
  authorize("ADMIN", "TEACHER"),
  asyncHandler(reportCardController.getReportCard),
);

router.patch(
  "/:id/teacher-remark",
  protect,
  authorize("ADMIN", "TEACHER"),
  asyncHandler(reportCardController.updateTeacherRemark),
);

router.patch(
  "/:id/principal-remark",
  protect,
  authorize("ADMIN"),
  asyncHandler(reportCardController.updatePrincipalRemark),
);

router.get(
  "/student/:studentId",
  protect,
  authorize("STUDENT"),
  asyncHandler(reportCardController.getStudentReportCard),
);

router.get(
  "/class/:classId",
  protect,
  authorize("ADMIN", "TEACHER"),
  asyncHandler(reportCardController.getClassReportCards),
);

router.patch(
  "/:id/publish",
  protect,
  authorize("ADMIN"),
  asyncHandler(reportCardController.publishReportCard),
);
```
Base URL:

```
/api/v1/report-cards

```

# 9. Generate Report Card

## Endpoint

```
POST /api/v1/report-cards/generate
```

### Authorization

```
ADMIN
```

### Request body

```
{
  "studentId": "STUDENT_ID",
  "sessionId": "SESSION_ID",
  "termId": "TERM_ID"
}
```

### What happens

The service:

- Validates studentId.
- Validates sessionId.
- Validates termId.
- Finds the student’s enrollment.
- Ensures the enrollment belongs to the authenticated school.
- Checks whether a report card already exists.
- Gets the student’s academic results.
- Calculates the average.
- Determines the overall grade.
- Determines the class position.
- Creates the report card.
A new report card starts as:

```
{
  "published": false,
  "publishedAt": null,
  "teacherRemark": null,
  "principalRemark": null
}

```

# 10. Get Report Card

## Endpoint

```
GET /api/v1/report-cards/:studentId
```

### Authorization

```
ADMIN
TEACHER
```
This endpoint is intended for administrators and teachers who need to access a student’s report card.

# 11. Get Class Report Cards

## Endpoint

```
GET /api/v1/report-cards/class/:classId
```

### Authorization

```
ADMIN
TEACHER
```
The endpoint requires:

```
sessionId
termId
```
as query parameters.

### Example

```
GET /api/v1/report-cards/class/CLASS_ID?sessionId=SESSION_ID&termId=TERM_ID
```
The response contains:

- Class information.
- Session information.
- Term information.
- Number of students.
- Report cards for the students.
Example structure:

```
{
  "message": "Class report cards retrieved successfully",
  "data": {
    "class": {},
    "session": {},
    "term": {},
    "totalStudents": 1,
    "reportCards": []
  }
}

```

# 12. Update Teacher Remark

## Endpoint

```
PATCH /api/v1/report-cards/:id/teacher-remark
```

### Authorization

```
ADMIN
TEACHER
```

### Request body

```
{
  "remark": "The student has shown excellent academic progress this term."
}
```
The service validates that a remark was provided.

An empty value results in:

```
Teacher remark is required.
```
The report card must also not already be published.

If published:

```
Published report cards cannot be modified.

```

# 13. Update Principal Remark

## Endpoint

```
PATCH /api/v1/report-cards/:id/principal-remark
```

### Authorization

```
ADMIN
```

### Request body

```
{
  "remark": "The student has demonstrated excellent academic performance and discipline throughout the term."
}
```
An empty remark results in:

```
Principal remark is required.
```
Published report cards cannot be modified.

# 14. Publish Report Card

## Endpoint

```
PATCH /api/v1/report-cards/:id/publish
```

### Authorization

```
ADMIN
```
Publishing changes:

```
published: false
```
to:

```
published: true
```
and sets:

```
publishedAt
```
to the current date/time.

Example:

```
{
  "published": true,
  "publishedAt": "2026-08-15T07:15:23.775Z"
}
```
A report card cannot be published twice.

If an already-published report card is submitted again, the API returns:

```
Report card has already been published.

```

# 15. Student Report Card

## Endpoint

```
GET /api/v1/report-cards/student/:studentId
```

### Authorization

```
STUDENT
```
The request requires:

```
sessionId
termId
```

### Example

```
GET /api/v1/report-cards/student/STUDENT_ID?sessionId=SESSION_ID&termId=TERM_ID
```
The student must authenticate with their own JWT.

The response includes:

- Student information.
- Class.
- Session.
- Term.
- Average.
- Position.
- Teacher remark.
- Principal remark.
- Publication status.
- Publication date.
- Subjects.
- Assessments.
- Subject scores.
- Subject grades.
- Subject remarks.
- Total obtained score.
- Total possible score.

# 16. Student Report Card Example

A successful response looks like:

```
{
  "message": "Report card retrieved successfully",
  "data": {
    "id": "REPORT_CARD_ID",

    "student": {
      "id": "STUDENT_ID",
      "name": "Favour boy",
      "email": "hugofavour11@gmail.com"
    },

    "class": {
      "id": "CLASS_ID",
      "name": "JSS2A"
    },

    "session": {
      "id": "SESSION_ID",
      "name": "2026/2027"
    },

    "term": {
      "id": "TERM_ID",
      "name": "First Term"
    },

    "average": 70,
    "position": 1,

    "teacherRemark": "The student has shown excellent academic progress this term.",

    "principalRemark": "The student has demonstrated excellent academic performance and discipline throughout the term.",

    "published": true,

    "publishedAt": "2026-08-15T07:15:23.775Z",

    "subjects": [
      {
        "subject": {
          "name": "English Language",
          "code": "ENG101"
        },

        "assessments": [
          {
            "title": "CA 1",
            "type": "CA",
            "maxScore": 20,
            "obtainedScore": 14
          }
        ],

        "totalScore": 14,
        "totalPossible": 20,
        "percentage": 70,
        "grade": "A",
        "remark": "Excellent"
      }
    ],

    "totalSubjects": 1,
    "totalObtained": 14,
    "totalPossible": 20
  }
}

```

# 17. Report Card State

A report card can exist in two major states.

## Draft

```
published = false
```
The report card can still be modified.

Teacher remarks and principal remarks can be added or changed.

## Published

```
published = true
```
The report card is considered final.

The system prevents further modifications.

Students are allowed to retrieve the report card.

# 18. Complete Testing Workflow

When testing the module with Postman, use this order:

### Step 1 — Login as ADMIN

```
POST /api/v1/auth/login
```
Use the administrator’s credentials.

### Step 2 — Generate Report Card

```
POST /api/v1/report-cards/generate
```
Provide:

```
{
  "studentId": "STUDENT_ID",
  "sessionId": "SESSION_ID",
  "termId": "TERM_ID"
}
```
Confirm:

```
published = false

```

### Step 3 — Add Teacher Remark

```
PATCH /api/v1/report-cards/REPORT_CARD_ID/teacher-remark
```
Body:

```
{
  "remark": "The student has shown excellent academic progress this term."
}

```

### Step 4 — Add Principal Remark

```
PATCH /api/v1/report-cards/REPORT_CARD_ID/principal-remark
```
Body:

```
{
  "remark": "The student has demonstrated excellent academic performance and discipline throughout the term."
}

```

### Step 5 — Publish

```
PATCH /api/v1/report-cards/REPORT_CARD_ID/publish
```
Confirm:

```
published = true

```

### Step 6 — Login as STUDENT

```
POST /api/v1/auth/login
```
Use the student’s credentials.

Copy the returned JWT.

### Step 7 — Retrieve Student Report Card

```
GET /api/v1/report-cards/student/STUDENT_ID?sessionId=SESSION_ID&termId=TERM_ID
```
Use:

```
Authorization: Bearer STUDENT_JWT
```
The published report card should now be returned.

# 19. Important Business Rules

The following rules are currently enforced:

### Rule 1

A report card requires:

```
Student
Session
Term
```

### Rule 2

A student cannot have multiple report cards for the same enrollment and term.

### Rule 3

Only admins can generate report cards.

### Rule 4

Teachers can add teacher remarks.

### Rule 5

Admins can add principal remarks.

### Rule 6

Only admins can publish report cards.

### Rule 7

Published report cards cannot be modified.

### Rule 8

Students can access their published report cards.

### Rule 9

Report-card operations are restricted to the authenticated user’s school.

### Rule 10

A report card must contain an overall grade and overall remark.

# 20. Current Status

The Report Card module has been successfully tested end-to-end.

### Confirmed working

```
✓ Report card generation
✓ Overall average calculation
✓ Overall grade calculation
✓ Overall remark calculation
✓ Class position
✓ Teacher remarks
✓ Principal remarks
✓ Publishing
✓ Published-state protection
✓ Student JWT authentication
✓ Student authorization
✓ Student report-card retrieval
✓ Session filtering
✓ Term filtering
✓ Subject results
✓ Assessment results
✓ Subject grades
✓ Class report-card retrieval
```
The module is therefore ready to be treated as a completed backend feature.

# 21. Recommended Next Improvement

One small consistency improvement remains:

The student report-card response should also expose:

```
{
  "overallGrade": "A",
  "overallRemark": "Excellent"
}
```
These values already exist in the ReportCard database record, but the current student response does not return them.

After adding those two fields to the student response, the Report Card module can be considered fully documented and complete.

# 22. Module Structure

The module follows the project’s service/controller/router architecture:

```
modules/
└── report-card/
    ├── reportCard.controller.js
    ├── reportCard.service.js
    └── reportCard.routes.js
```
Responsibilities:

### Controller

Handles:

- HTTP requests.
- Request parameters.
- Request body.
- Query parameters.
- HTTP responses.

### Service

Handles:

- Business logic.
- Prisma database operations.
- Validation.
- Grade calculations.
- Report-card generation.
- Publishing rules.
- Authorization-related business rules.

### Router

Handles:

- Endpoint definitions.
- Authentication middleware.
- Role authorization.
- Async error handling.
This separation keeps the report-card business logic out of the HTTP controllers and makes the module easier to maintain and extend.
