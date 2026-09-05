import Joi from "joi";

const updateSchoolSchema = Joi.object({
  name: Joi.string().trim().min(2).required(),
});

const paymentSettingsSchema = Joi.object({
  paystackSecretKey: Joi.string().trim().required(),
  paystackPublicKey: Joi.string().trim().required(),
});

export const validateUpdateSchool = (req, res, next) => {
  const { error, value } = updateSchoolSchema.validate(req.body, {
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

export const validatePaymentSettings = (req, res, next) => {
  const { error, value } = paymentSettingsSchema.validate(req.body, {
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
