import Joi from "joi";

// Create invoice for one student
const createInvoiceSchema = Joi.object({
  feeId: Joi.string().uuid().required(),
  enrollmentId: Joi.string().uuid().required(),
});

// Generate invoices for an entire class
const generateClassInvoicesSchema = Joi.object({
  feeId: Joi.string().uuid().required(),
  classId: Joi.string().uuid().required(),
});

// Filter invoices
const getInvoicesQuerySchema = Joi.object({
  sessionId: Joi.string().uuid(),
  termId: Joi.string().uuid(),
  classId: Joi.string().uuid(),
  enrollmentId: Joi.string().uuid(),
  status: Joi.string().valid(
    "PENDING",
    "PARTIALLY_PAID",
    "PAID",
    "OVERDUE",
    "CANCELLED",
  ),
});

// Validate create invoice
export function validateCreateInvoice(req, res, next) {
  const { error, value } = createInvoiceSchema.validate(req.body, {
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

// Validate class invoice generation
export function validateGenerateClassInvoices(req, res, next) {
  const { error, value } = generateClassInvoicesSchema.validate(req.body, {
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

// Validate invoice filters
export function validateGetInvoices(req, res, next) {
  const { error, value } = getInvoicesQuerySchema.validate(req.query, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      message: "Validation failed",
      errors: error.details.map((detail) => detail.message),
    });
  }

  req.query = value;
  next();
}
