import prisma from "../../config/prisma.js";

// Generate a unique invoice number
const generateInvoiceNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();

  return `INV-${timestamp}-${random}`;
};

// =====================================================
// CREATE INVOICE FOR ONE STUDENT
// =====================================================

export const createInvoice = async ({ feeId, enrollmentId, schoolId }) => {
  // 1. Get the fee
  const fee = await prisma.fee.findFirst({
    where: {
      id: feeId,
      schoolId,
    },
  });

  if (!fee) {
    throw new Error("Fee not found");
  }

  // 2. Get the student's enrollment
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      id: enrollmentId,
      class: {
        schoolId,
      },
    },

    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      class: true,
      session: true,
    },
  });

  if (!enrollment) {
    throw new Error("Student enrollment not found");
  }

  // 3. Make sure the enrollment belongs
  // to the same session as the fee
  if (enrollment.sessionId !== fee.sessionId) {
    throw new Error(
      "Fee and student enrollment belong to different academic sessions",
    );
  }

  // 4. If fee belongs to a class,
  // make sure student's class matches
  if (fee.classId && fee.classId !== enrollment.classId) {
    throw new Error("This fee does not apply to the student's class");
  }

  // 5. Check if invoice already exists
  const existingInvoice = await prisma.invoice.findFirst({
    where: {
      enrollmentId,
      feeId,
    },
  });

  if (existingInvoice) {
    throw new Error("An invoice for this fee already exists for this student");
  }

  // 6. Create invoice
  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber: generateInvoiceNumber(),

      description: fee.description || fee.name,

      amount: fee.amount,

      amountPaid: 0,

      status: "PENDING",

      enrollmentId,

      feeId,
    },

    include: {
      fee: true,

      enrollment: {
        include: {
          student: {
            id: true,
            name: true,
            email: true,
            role: true,
            schoolId: true,
            isActive: true,
          },
          class: true,
          session: true,
        },
      },
    },
  });

  return invoice;
};

// =====================================================
// GENERATE INVOICES FOR A CLASS (OR ENTIRE SCHOOL)
// =====================================================

export const generateClassInvoices = async ({ feeId, classId, schoolId }) => {
  // 1. Find fee
  const fee = await prisma.fee.findFirst({
    where: {
      id: feeId,
      schoolId,
    },
  });

  if (!fee) {
    throw new Error("Fee not found");
  }

  // 2. Build the class filter dynamically
  let classFilter = {};

  if (classId === "ALL") {
    // If generating for the whole school, ensure the fee isn't locked to just one class
    if (fee.classId) {
      throw new Error(
        "This fee is locked to a specific class. You cannot generate it for the entire school.",
      );
    }
    // classFilter remains empty, meaning "fetch everyone"
  } else {
    // If generating for a specific class, verify it exists
    const schoolClass = await prisma.class.findFirst({
      where: {
        id: classId,
        schoolId,
      },
    });

    if (!schoolClass) {
      throw new Error("Class not found");
    }

    // Make sure fee applies to this specific class
    if (fee.classId && fee.classId !== classId) {
      throw new Error("This fee does not apply to the selected class");
    }

    classFilter = { classId };
  }

  // 3. Get all enrollments for this class (or ALL classes)
  // in the fee's academic session
  const enrollments = await prisma.enrollment.findMany({
    where: {
      ...classFilter, // Applies the { classId } if it's not "ALL"
      sessionId: fee.sessionId,
      class: {
        schoolId, // Security check: Ensure they belong to this school
      },
    },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          schoolId: true,
        },
      },
      class: true,
      session: true,
    },
  });

  if (enrollments.length === 0) {
    throw new Error(
      "No students found for this selection in the current academic session",
    );
  }

  // 4. Create invoices
  const createdInvoices = [];
  const skippedInvoices = [];

  for (const enrollment of enrollments) {
    // Check if invoice already exists
    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        enrollmentId: enrollment.id,
        feeId,
      },
    });

    if (existingInvoice) {
      skippedInvoices.push({
        enrollmentId: enrollment.id,
        studentId: enrollment.studentId,
        reason: "Invoice already exists",
      });
      continue;
    }

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: generateInvoiceNumber(),
        description: fee.description || fee.name,
        amount: fee.amount,
        amountPaid: 0,
        status: "PENDING",
        enrollmentId: enrollment.id,
        feeId,
      },
      include: {
        fee: true,
        enrollment: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
            class: true,
            session: true,
          },
        },
      },
    });

    createdInvoices.push(invoice);
  }

  return {
    createdCount: createdInvoices.length,
    skippedCount: skippedInvoices.length,
    createdInvoices,
    skippedInvoices,
  };
};

// =====================================================
// APPLY PAYMENT TO INVOICE
// =====================================================

export const applyPaymentToInvoice = async ({
  paymentId,
  invoiceId,
  amount,
  providerTransactionId,
  paidAt,
}) => {
  return prisma.$transaction(async (tx) => {
    // ==========================================
    // 1. Find the payment
    // ==========================================

    const payment = await tx.payment.findUnique({
      where: {
        id: paymentId,
      },
    });

    if (!payment) {
      throw new Error("Payment not found");
    }

    // ==========================================
    // 2. Make sure payment belongs to invoice
    // ==========================================

    if (payment.invoiceId !== invoiceId) {
      throw new Error("Payment does not belong to this invoice");
    }

    // ==========================================
    // 3. Prevent duplicate processing
    // ==========================================

    if (payment.status === "SUCCESS") {
      const invoice = await tx.invoice.findUnique({
        where: {
          id: invoiceId,
        },
      });

      if (!invoice) {
        throw new Error("Invoice not found");
      }

      return {
        alreadyProcessed: true,
        invoice,
        payment,
      };
    }

    // ==========================================
    // 4. Find invoice
    // ==========================================

    const invoice = await tx.invoice.findUnique({
      where: {
        id: invoiceId,
      },
    });

    if (!invoice) {
      throw new Error("Invoice not found");
    }

    // ==========================================
    // 5. Make sure invoice isn't already paid
    // ==========================================

    if (invoice.status === "PAID") {
      throw new Error("This invoice has already been fully paid");
    }

    // ==========================================
    // 6. Validate payment amount
    // ==========================================

    if (amount.lessThanOrEqualTo(0)) {
      throw new Error("Payment amount must be greater than zero");
    }

    // ==========================================
    // 7. Make sure payment doesn't exceed balance
    // ==========================================

    const remainingBalance = invoice.amount.minus(invoice.amountPaid);

    if (amount.greaterThan(remainingBalance)) {
      throw new Error("Payment amount exceeds the invoice balance");
    }

    // ==========================================
    // 8. Calculate new amount paid
    // ==========================================

    const newAmountPaid = invoice.amountPaid.plus(amount);

    // ==========================================
    // 9. Determine invoice status
    // ==========================================

    const newStatus = newAmountPaid.greaterThanOrEqualTo(invoice.amount)
      ? "PAID"
      : "PARTIALLY_PAID";

    // ==========================================
    // 10. Update invoice
    // ==========================================

    const updatedInvoice = await tx.invoice.update({
      where: {
        id: invoice.id,
      },

      data: {
        amountPaid: newAmountPaid,
        status: newStatus,
      },
    });

    // ==========================================
    // 11. Mark payment as successful
    // ==========================================

    const updatedPayment = await tx.payment.update({
      where: {
        id: payment.id,
      },

      data: {
        status: "SUCCESS",

        paidAt: paidAt || new Date(),

        ...(providerTransactionId && {
          providerTransactionId,
        }),
      },
    });

    // ==========================================
    // 12. Return consistent result
    // ==========================================

    return {
      alreadyProcessed: false,
      invoice: updatedInvoice,
      payment: updatedPayment,
    };
  });
};

// =====================================================
// GET CURRENT STUDENT'S INVOICES
// =====================================================

export const getMyInvoices = async ({ studentId, schoolId }) => {
  return prisma.invoice.findMany({
    where: {
      enrollment: {
        studentId,
        class: {
          schoolId,
        },
      },
    },

    include: {
      fee: {
        include: {
          session: true,
          term: true,
          class: true,
        },
      },

      enrollment: {
        include: {
          class: true,
          session: true,
        },
      },

      payments: true,
    },

    orderBy: {
      createdAt: "desc",
    },
  });
};

export const getInvoiceById = async (id, schoolId) => {
  return prisma.invoice.findFirst({
    where: {
      id,
      enrollment: {
        class: {
          schoolId,
        },
      },
    },
    include: {
      fee: {
        include: {
          session: true,
          term: true,
          class: true,
        },
      },

      enrollment: {
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          class: true,
          session: true,
        },
      },

      payments: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });
};

export const getInvoices = async (schoolId, filters = {}) => {
  const { sessionId, termId, classId, enrollmentId, studentId, status } =
    filters;

  return prisma.invoice.findMany({
    where: {
      enrollment: {
        ...(enrollmentId && {
          id: enrollmentId,
        }),

        ...(studentId && {
          studentId,
        }),

        ...(classId && {
          classId,
        }),

        class: {
          schoolId,
        },
      },

      ...(sessionId || termId
        ? {
            fee: {
              ...(sessionId && {
                sessionId,
              }),

              ...(termId && {
                termId,
              }),
            },
          }
        : {}),

      ...(status && {
        status,
      }),
    },

    include: {
      fee: {
        include: {
          session: true,
          term: true,
          class: true,
        },
      },

      enrollment: {
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },

          class: true,
          session: true,
        },
      },

      payments: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },
  });
};
