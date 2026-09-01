import Joi from "joi";

const createFeeSchema = Joi.object({
  name: Joi.string().trim().required(),
  description: Joi.string().trim().allow("", null),
  amount: Joi.number().positive().precision(2).required(),
  sessionId: Joi.string().uuid().required(),
  termId: Joi.string().uuid().allow(null),
  classId: Joi.string().uuid().allow(null),
});

const updateFeeSchema = Joi.object({
  name: Joi.string().trim(),
  description: Joi.string().trim().allow("", null),
  amount: Joi.number().positive().precision(2),
  sessionId: Joi.string().uuid(),
  termId: Joi.string().uuid().allow(null),
  classId: Joi.string().uuid().allow(null),
}).min(1); // at least one field must be provided on update

const getFeesQuerySchema = Joi.object({
  sessionId: Joi.string().uuid(),
  termId: Joi.string().uuid(),
  classId: Joi.string().uuid(),
});

export function validateCreateFee(req, res, next) {
  const { error, value } = createFeeSchema.validate(req.body, {
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

export function validateUpdateFee(req, res, next) {
  const { error, value } = updateFeeSchema.validate(req.body, {
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

export function validateGetFees(req, res, next) {
  const { error, value } = getFeesQuerySchema.validate(req.query, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: error.details.map((detail) => detail.message),
    });
  }

  // Do NOT do: req.query = value
  // Express treats req.query as read-only.

  req.validatedQuery = value;

  next();
}
