import Joi from "joi";

const createStudentSchema = Joi.object({
  name: Joi.string().trim().min(2).required(),
  email: Joi.string().trim().email().required(),
  password: Joi.string().min(8).required(),
  classId: Joi.string().trim().allow("").optional(),
});

const updateStudentSchema = Joi.object({
  name: Joi.string().trim().min(2),
  email: Joi.string().trim().email(),
  // classId can be:
  //   - omitted            -> leave the student's enrollment untouched
  //   - a valid class id   -> reassign to that class
  //   - "" (empty string)  -> explicitly unassign the student's class
  classId: Joi.string().trim().allow("", null).optional(),
}).min(1);

export function validateCreateStudent(req, res, next) {
  const { error, value } = createStudentSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true, // Now it keeps classId and strips everything else
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

export function validateUpdateStudent(req, res, next) {
  const { error, value } = updateStudentSchema.validate(req.body, {
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
