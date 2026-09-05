import Joi from "joi";

const createTeacherSchema = Joi.object({
  name: Joi.string().trim().min(2).required(),
  email: Joi.string().trim().email().required(),
  password: Joi.string().min(8).required(),
});

const updateTeacherSchema = Joi.object({
  name: Joi.string().trim().min(2),
  email: Joi.string().trim().email(),
}).min(1);

export function validateCreateTeacher(req, res, next) {
  const { error, value } = createTeacherSchema.validate(req.body, {
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

export function validateUpdateTeacher(req, res, next) {
  const { error, value } = updateTeacherSchema.validate(req.body, {
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
