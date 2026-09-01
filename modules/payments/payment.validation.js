import Joi from "joi";

const initializePaymentSchema = Joi.object({
  invoiceId: Joi.string().uuid().required(),
});

const verifyPaymentSchema = Joi.object({
  reference: Joi.string().trim().required(),
});

export const validateInitializePayment = (req, res, next) => {
  const { error, value } = initializePaymentSchema.validate(req.body, {
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

  req.body = value;
  next();
};

export const validateVerifyPayment = (req, res, next) => {
  const { error, value } = verifyPaymentSchema.validate(req.params, {
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

  req.params = value;
  next();
};

export const validatePaymentHistory = (req, res, next) => {
  const schema = Joi.object({
    studentId: Joi.string().uuid().optional(),

    startDate: Joi.date().iso().optional(),

    endDate: Joi.date().iso().min(Joi.ref("startDate")).optional(),

    page: Joi.number().integer().min(1).default(1),

    limit: Joi.number().integer().min(1).max(100).default(10),

    status: Joi.string()
      .valid("PENDING", "SUCCESS", "FAILED", "ABANDONED", "PARTIALLY_PAID")
      .optional(),
  });

  const { error, value } = schema.validate(req.query, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      success: false,
      message: "Invalid payment history filters",
      errors: error.details.map((detail) => detail.message),
    });
  }

  Object.assign(req.query, value);
  next();
};
