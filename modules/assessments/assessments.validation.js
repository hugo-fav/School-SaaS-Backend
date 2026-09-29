import Joi from "joi";

const ASSESSMENT_TYPES = [
  "ASSIGNMENT",
  "QUIZ",
  "CA",
  "PROJECT",
  "PRACTICAL",
  "EXAM",
];

// Joi.number() coerces a numeric string ("30") to a real number by default,
// which matters here because the frontend's <input type="number"> value
// arrives as a string in React state.
const createAssessmentSchema = Joi.object({
  title: Joi.string().trim().min(1).required(),
  description: Joi.string().trim().allow("", null).optional(),
  type: Joi.string()
    .valid(...ASSESSMENT_TYPES)
    .required(),
  maxScore: Joi.number().greater(0).required(),
  dueDate: Joi.date().iso().optional(),
  teacherSubjectId: Joi.string().trim().required(),
  termId: Joi.string().trim().required(),
});

const updateAssessmentSchema = Joi.object({
  title: Joi.string().trim().min(1),
  description: Joi.string().trim().allow("", null),
  type: Joi.string().valid(...ASSESSMENT_TYPES),
  maxScore: Joi.number().greater(0),
  dueDate: Joi.date().iso().allow(null),
  teacherSubjectId: Joi.string().trim(),
  termId: Joi.string().trim(),
}).min(1);

export function validateCreateAssessment(req, res, next) {
  const { error, value } = createAssessmentSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      message: "Validation failed",
      errors: error.details.map((detail) => detail.message),
    });
  }

  req.body = value;
  next();
}

export function validateUpdateAssessment(req, res, next) {
  const { error, value } = updateAssessmentSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      message: "Validation failed",
      errors: error.details.map((detail) => detail.message),
    });
  }

  req.body = value;
  next();
}
