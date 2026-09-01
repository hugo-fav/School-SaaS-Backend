import prisma from "../../config/prisma.js";
import { decrypt } from "../../utils/crypto.js";
import { applyPaymentToInvoice } from "../invoices/invoice.service.js";

function generateReference() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 10);
  return `PAY-${timestamp}-${random}`.toUpperCase();
}

async function callPaystackInitialize({ secretKey, email, amount, reference }) {
  const response = await fetch(
    "https://api.paystack.co/transaction/initialize",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: amount.times(100).toNumber(),
        reference,
      }),
    },
  );

  const data = await response.json();

  if (!response.ok || !data.status) {
    throw new Error(
      data.message || "Failed to initialize payment with Paystack",
    );
  }

  return data.data;
}

async function callPaystackVerify({ secretKey, reference }) {
  const response = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
    },
  );

  const data = await response.json();

  if (!response.ok || !data.status) {
    throw new Error(data.message || "Failed to verify payment with Paystack");
  }

  return data.data;
}

export const initializePayment = async ({ invoiceId, studentId }) => {
  const invoice = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      enrollment: { studentId },
    },
    include: {
      enrollment: {
        include: { student: true, class: true, session: true },
      },
      fee: { include: { session: true, term: true } },
    },
  });

  if (!invoice) {
    throw new Error("Invoice not found or you do not have access to it");
  }

  if (invoice.status === "PAID") {
    throw new Error("This invoice has already been paid");
  }

  if (invoice.status === "CANCELLED") {
    throw new Error("This invoice has been cancelled");
  }

  const school = await prisma.school.findUnique({
    where: { id: invoice.enrollment.class.schoolId },
    select: { id: true, paystackSecretKey: true },
  });

  if (!school) {
    throw new Error("School not found");
  }

  if (!school.paystackSecretKey) {
    throw new Error("This school has not connected a payment provider yet");
  }

  const amountDue = invoice.amount.minus(invoice.amountPaid);

  if (amountDue.lessThanOrEqualTo(0)) {
    throw new Error("There is no outstanding balance on this invoice");
  }

  const secretKey = decrypt(school.paystackSecretKey);
  const reference = generateReference();

  const payment = await prisma.payment.create({
    data: {
      reference,
      amount: amountDue,
      status: "PENDING",
      provider: "paystack",
      invoiceId: invoice.id,
      schoolId: school.id,
    },
  });

  try {
    const result = await callPaystackInitialize({
      secretKey,
      email: invoice.enrollment.student.email,
      amount: amountDue,
      reference,
    });

    return {
      paymentId: payment.id,
      reference,
      authorizationUrl: result.authorization_url,
      accessCode: result.access_code,
    };
  } catch (error) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED" },
    });

    throw error;
  }
};

export const verifyPayment = async ({
  reference,
  schoolId,
  requesterId,
  requesterRole,
}) => {
  const payment = await prisma.payment.findFirst({
    where: { reference, schoolId },
    include: {
      invoice: {
        include: {
          enrollment: {
            select: { studentId: true },
          },
        },
      },
    },
  });

  if (!payment) {
    throw new Error("Payment not found");
  }

  // Students may only verify their own payment
  if (
    requesterRole === "STUDENT" &&
    payment.invoice.enrollment.studentId !== requesterId
  ) {
    throw new Error("You do not have access to this payment");
  }

  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: { paystackSecretKey: true },
  });

  if (!school) {
    throw new Error("School not found");
  }

  if (!school.paystackSecretKey) {
    throw new Error("This school has not connected a payment provider yet");
  }

  const secretKey = decrypt(school.paystackSecretKey);
  const transaction = await callPaystackVerify({ secretKey, reference });

  if (transaction.reference !== payment.reference) {
    throw new Error("Payment reference mismatch");
  }

  const paidAmount = Number(transaction.amount);
  const expectedAmount = payment.amount.times(100).toNumber();

  if (paidAmount !== expectedAmount) {
    throw new Error("Payment amount does not match");
  }

  if (transaction.status === "success") {
    const result = await applyPaymentToInvoice({
      paymentId: payment.id,
      invoiceId: payment.invoiceId,
      amount: payment.amount,
      providerTransactionId: String(transaction.id),
      paidAt: new Date(transaction.paid_at),
    });

    return {
      success: true,
      payment: result.payment,
      invoiceStatus: result.alreadyProcessed ? null : result.invoice.status,
    };
  }

  let paymentStatus = "FAILED";
  if (transaction.status === "abandoned") {
    paymentStatus = "ABANDONED";
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: paymentStatus },
  });

  return {
    success: false,
    status: paymentStatus,
    message: "Payment was not successful",
  };
};

export const getPaymentHistory = async ({
  schoolId,
  studentId,
  startDate,
  endDate,
  page = 1,
  limit = 10,
  status,
}) => {
  const skip = (page - 1) * limit;

  // Build date filter
  const dateFilter = {};

  if (startDate) {
    dateFilter.gte = new Date(startDate);
  }

  if (endDate) {
    const end = new Date(endDate);

    // Include the entire end date
    end.setHours(23, 59, 59, 999);

    dateFilter.lte = end;
  }

  const where = {
    schoolId,

    ...(status && {
      status,
    }),

    ...(studentId && {
      invoice: {
        enrollment: {
          studentId,
        },
      },
    }),

    ...(startDate || endDate
      ? {
          createdAt: dateFilter,
        }
      : {}),
  };

  const [payments, total] = await prisma.$transaction([
    prisma.payment.findMany({
      where,
      skip,
      take: limit,

      include: {
        invoice: {
          include: {
            fee: {
              select: {
                id: true,
                name: true,
                amount: true,
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

                class: {
                  select: {
                    id: true,
                    name: true,
                  },
                },

                session: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    }),

    prisma.payment.count({
      where,
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    payments,

    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
};
