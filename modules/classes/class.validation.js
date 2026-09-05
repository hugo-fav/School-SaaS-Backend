import Joi from "joi";

const createClassSchema = Joi.object({
  name: Joi.string().trim().min(1).required(),
});

const updateClassSchema = Joi.object({
  name: Joi.string().trim().min(1).required(),
});

const enrollStudentSchema = Joi.object({
  studentId: Joi.string().uuid().required(),
  sessionId: Joi.string().uuid().required(),
});

export function validateCreateClass(req, res, next) {
  const { error, value } = createClassSchema.validate(req.body, {
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

export function validateUpdateClass(req, res, next) {
  const { error, value } = updateClassSchema.validate(req.body, {
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

export function validateEnrollStudent(req, res, next) {
  const { error, value } = enrollStudentSchema.validate(req.body, {
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
