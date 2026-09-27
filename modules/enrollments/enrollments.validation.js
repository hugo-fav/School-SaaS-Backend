import Joi from "joi";

const createEnrollmentSchema = Joi.object({
  studentId: Joi.string().trim().required(),
  classId: Joi.string().trim().required(),
  sessionId: Joi.string().trim().required(),
});

// classId is the only field the service will ever accept on update —
// student and session are immutable once the enrollment exists.
const updateEnrollmentSchema = Joi.object({
  classId: Joi.string().trim().required(),
});

export function validateCreateEnrollment(req, res, next) {
  const { error, value } = createEnrollmentSchema.validate(req.body, {
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

export function validateUpdateEnrollment(req, res, next) {
  const { error, value } = updateEnrollmentSchema.validate(req.body, {
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
