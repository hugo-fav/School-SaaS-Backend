# Result Module Documentation

## Overview

The Result Module is responsible for retrieving and calculating a student’s academic performance for a specific academic session and term. It aggregates assessment scores, computes subject-level and overall performance, determines the student’s class position, and provides class statistics.

This module is read-only. It does not create, update, or delete academic records. Instead, it consumes data from the Assessment, Score, Enrollment, Academic Session, and Term modules to generate student results.

# Features

- Retrieve a student’s results for a specific session and term.
- Group assessments by subject.
- Calculate subject totals and percentages.
- Assign grades and remarks for each subject.
- Calculate overall performance.
- Calculate class position.
- Generate class statistics.
- Return a complete academic report for the requested student.

# Endpoint

## Get Student Result

Method

```
GET
```
Route

```
/api/v1/results/:studentId
```

### Query Parameters

| Parameter | Required | Description |
| --- | --- | --- |
| sessionId | Yes | Academic session ID |
| termId | Yes | Academic term ID |

Example:

```
GET /api/v1/results/96bf3a6b-451f-4986-8919-07344674736c?sessionId=9547d456-6687-436e-bb36-5cb2a9bbe131&termId=xxxxxxxx

```

# Authorization

Only authorized users within the same school can retrieve results.

Typical access includes:

- Admin
- Teacher (based on application policy)
- Student (future enhancement)

# Validation

The module validates:

- Student ID exists.
- Session ID is provided.
- Term ID is provided.
- Student belongs to the authenticated user’s school.
- Enrollment exists for the specified session.
- Term exists.
If any validation fails, an appropriate HTTP error is returned.

# Result Calculation Flow

## Step 1

Retrieve the student’s enrollment for the specified academic session.

## Step 2

Retrieve all scores belonging to that enrollment for the specified term.

## Step 3

Group scores by subject.

Each subject contains:

- Subject information
- Teacher information
- All assessments for that subject

## Step 4

Calculate each subject’s performance.

For every subject:

- Total score obtained
- Total obtainable score
- Percentage
- Grade
- Remark

## Step 5

Calculate overall performance.

The module computes:

- Total subjects
- Total marks obtained
- Total obtainable marks
- Overall percentage
- Overall grade
- Overall remark

## Step 6

Calculate class position.

The module:

- Retrieves every student enrolled in the same class.
- Calculates each student’s average.
- Sorts students from highest to lowest average.
- Assigns class positions.
- Returns the current student’s position.

## Step 7

Calculate class statistics.

The module computes:

- Class size
- Highest average
- Lowest average
- Class average

# Response Structure

```
{
  "student": {},
  "class": {},
  "session": {},
  "term": {},

  "totalSubjects": 8,
  "totalObtained": 563,
  "totalPossible": 800,
  "average": 70.38,

  "overallGrade": {
    "grade": "A",
    "remark": "Excellent"
  },

  "classPosition": 3,

  "classStatistics": {
    "classSize": 35,
    "highestAverage": 91.25,
    "lowestAverage": 42.50,
    "classAverage": 68.75
  },

  "subjects": [
    {
      "subject": {},
      "teacher": {},

      "assessments": [
        {
          "title": "CA 1",
          "type": "CA",
          "maxScore": 20,
          "obtainedScore": 18
        }
      ],

      "totalScore": 78,
      "totalPossible": 100,
      "percentage": 78,

      "grade": "A",

      "remark": "Excellent"
    }
  ]
}

```

# Helper Functions

The module uses dedicated helper functions to keep business logic modular.

## getGrade()

Determines the grade and remark for a percentage.

Returns:

- Grade
- Remark

## groupScoresBySubject()

Groups assessment scores by subject.

Returns grouped subject objects containing:

- Subject
- Teacher
- Assessments

## calculateSubjectResults()

Calculates subject-level statistics.

Returns:

- Subject total
- Subject percentage
- Grade
- Remark

## calculateOverallResult()

Calculates:

- Total subjects
- Overall marks
- Overall percentage
- Overall grade

## calculateClassPosition()

Determines the student’s rank within the class based on overall average.

Returns:

- Student average
- Class position

## calculateClassStatistics()

Calculates:

- Class size
- Highest average
- Lowest average
- Class average

# Dependencies

The Result Module depends on:

- Enrollment Module
- Score Module
- Assessment Module
- Academic Session Module
- Term Module
- Class Module

# Modules That Depend on Result

The following modules consume Result data:

- Report Card Module
- Transcript Module (future)
- Analytics Module (future)
- Parent Portal (future)

# Design Decisions

- Results are generated dynamically from stored assessment scores.
- No result records are stored in the database.
- Grades are calculated using reusable helper functions.
- Business logic is separated into dedicated utilities.
- The module is read-only and does not modify assessment or score data.

# Future Enhancements

- Teacher remarks
- Principal remarks
- Attendance summary
- Psychomotor assessment
- Affective assessment
- Publish/unpublish results
- Result locking
- Printable report cards (PDF)
- Transcript generation
- Result analytics dashboard
