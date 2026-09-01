import {
  initializePayment,
  verifyPayment,
  getPaymentHistory,
} from "./payment.service.js";

// INITIALIZE PAYMENT

export const initializePaymentController = async (req, res) => {
  try {
    const result = await initializePayment({
      invoiceId: req.body.invoiceId,
      studentId: req.user.id,
    });

    return res.status(200).json({
      success: true,
      message: "Payment initialized successfully",
      data: result,
    });
  } catch (error) {
    console.error("Initialize payment error:", error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// VERIFY PAYMENT

export const verifyPaymentController = async (req, res) => {
  try {
    const { reference } = req.params;

    const result = await verifyPayment({
      reference,
      schoolId: req.user.schoolId,
      requesterId: req.user.id,
      requesterRole: req.user.role,
    });

    return res.status(200).json({
      success: true,
      message: result.success
        ? "Payment verified successfully"
        : "Payment verification completed",
      data: result,
    });
  } catch (error) {
    console.error("Verify payment error:", error);

    const statusCode =
      error.message === "You do not have access to this payment" ? 403 : 400;

    return res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to verify payment",
    });
  }
};

// ADMIN: GET PAYMENT HISTORY

export const getPaymentHistoryController = async (req, res) => {
  try {
    const {
      studentId,
      startDate,
      endDate,
      page = 1,
      limit = 10,
      status,
    } = req.query;

    const result = await getPaymentHistory({
      schoolId: req.user.schoolId,
      studentId,
      startDate,
      endDate,
      page: Number(page),
      limit: Number(limit),
      status,
    });

    return res.status(200).json({
      success: true,
      message: "Payment history fetched successfully",
      data: result,
    });
  } catch (error) {
    console.error("Get payment history error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to fetch payment history",
    });
  }
};
