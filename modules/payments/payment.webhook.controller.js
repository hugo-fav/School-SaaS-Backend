import crypto from "crypto";
import prisma from "../../config/prisma.js";
import { decrypt } from "../../utils/crypto.js";
import { applyPaymentToInvoice } from "../invoices/invoice.service.js";

export const paystackWebhookController = async (req, res) => {
  try {
    const signature = req.headers["x-paystack-signature"];

    if (!signature) {
      return res.status(401).json({
        success: false,
        message: "Missing Paystack signature",
      });
    }

    const reference = req.body?.data?.reference;

    if (!reference) {
      return res.status(400).json({
        success: false,
        message: "Payment reference is missing",
      });
    }

    // Find the payment using the Paystack reference
    const payment = await prisma.payment.findUnique({
      where: { reference },
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    // Get the school's Paystack secret key
    const school = await prisma.school.findUnique({
      where: { id: payment.schoolId },
      select: {
        paystackSecretKey: true,
      },
    });

    if (!school || !school.paystackSecretKey) {
      return res.status(400).json({
        success: false,
        message: "Payment provider is not configured",
      });
    }

    const secretKey = decrypt(school.paystackSecretKey);

    // Verify Paystack signature using the RAW request body
    const hash = crypto
      .createHmac("sha512", secretKey)
      .update(req.rawBody)
      .digest("hex");

    if (hash !== signature) {
      return res.status(401).json({
        success: false,
        message: "Invalid Paystack signature",
      });
    }

    const event = req.body;

    // We only process successful payments
    if (event.event !== "charge.success") {
      return res.status(200).json({
        success: true,
        message: "Webhook received but no action required",
      });
    }

    const transaction = event.data;

    // Make sure the references match
    if (transaction.reference !== payment.reference) {
      return res.status(400).json({
        success: false,
        message: "Payment reference mismatch",
      });
    }

    // Paystack sends amount in kobo
    const paidAmount = Number(transaction.amount);

    // Our database stores the amount in Naira as Decimal
    const expectedAmount = payment.amount.times(100).toNumber();

    if (paidAmount !== expectedAmount) {
      return res.status(400).json({
        success: false,
        message: "Payment amount does not match",
      });
    }

    // Apply payment to invoice
    const result = await applyPaymentToInvoice({
      paymentId: payment.id,
      invoiceId: payment.invoiceId,
      amount: payment.amount,
      providerTransactionId: String(transaction.id),
      paidAt: transaction.paid_at ? new Date(transaction.paid_at) : new Date(),
    });

    return res.status(200).json({
      success: true,
      message: result.alreadyProcessed
        ? "Payment was already processed"
        : "Payment processed successfully",
    });
  } catch (error) {
    console.error("Paystack webhook error:", error);

    return res.status(500).json({
      success: false,
      message: "Webhook processing failed",
    });
  }
};
