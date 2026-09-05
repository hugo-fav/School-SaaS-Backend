import Joi from "joi";

const createTeacherSubjectSchema = Joi.object({
  teacherId: Joi.string().uuid().required(),
  subjectId: Joi.string().uuid().required(),
  classId: Joi.string().uuid().required(),
  sessionId: Joi.string().uuid().required(),
});

const updateTeacherSubjectSchema = Joi.object({
  teacherId: Joi.string().uuid(),
  subjectId: Joi.string().uuid(),
  classId: Joi.string().uuid(),
  sessionId: Joi.string().uuid(),
}).min(1);

export function validateCreateTeacherSubject(req, res, next) {
  const { error, value } = createTeacherSubjectSchema.validate(req.body, {
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

export function validateUpdateTeacherSubject(req, res, next) {
  const { error, value } = updateTeacherSubjectSchema.validate(req.body, {
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
