import {
  createInvoice,
  generateClassInvoices,
  getInvoices,
  getMyInvoices,
  getInvoiceById,
} from "./invoice.service.js";

// ==========================================
// ADMIN: CREATE INVOICE
// ==========================================

export const createInvoiceController = async (req, res) => {
  try {
    const { schoolId } = req.user;
    const { feeId, enrollmentId } = req.body;

    const invoice = await createInvoice({
      feeId,
      enrollmentId,
      schoolId,
    });

    return res.status(201).json({
      success: true,
      message: "Invoice created successfully",
      data: invoice,
    });
  } catch (error) {
    console.error("Create invoice error:", error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// ADMIN: GENERATE CLASS INVOICES
// ==========================================

export const generateClassInvoicesController = async (req, res) => {
  try {
    const { schoolId } = req.user;
    const { feeId, classId } = req.body;

    const result = await generateClassInvoices({
      feeId,
      classId,
      schoolId,
    });

    return res.status(201).json({
      success: true,
      message: `${result.createdCount} invoice(s) created, ${result.skippedCount} skipped`,
      data: result,
    });
  } catch (error) {
    console.error("Generate class invoices error:", error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// ADMIN: GET / FILTER INVOICES
// ==========================================

export const getInvoicesController = async (req, res) => {
  try {
    const { sessionId, termId, classId, enrollmentId, studentId, status } =
      req.query;

    const invoices = await getInvoices(req.user.schoolId, {
      sessionId,
      termId,
      classId,
      enrollmentId,
      studentId,
      status,
    });

    return res.status(200).json({
      success: true,
      message: "Invoices fetched successfully",
      data: invoices,
    });
  } catch (error) {
    console.error("Get invoices error:", error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
// ==========================================
// STUDENT: GET OWN INVOICES
// ==========================================

export const getMyInvoicesController = async (req, res) => {
  try {
    const invoices = await getMyInvoices({
      studentId: req.user.id,
      schoolId: req.user.schoolId,
    });

    return res.status(200).json({
      success: true,
      message: "Your invoices fetched successfully",
      data: invoices,
    });
  } catch (error) {
    console.error("Get student invoices error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch your invoices",
    });
  }
};

// ==========================================
// ADMIN/STUDENT: GET SINGLE INVOICE
// ==========================================

export const getInvoiceByIdController = async (req, res) => {
  try {
    const { schoolId, role, id: userId } = req.user;
    const { id } = req.params;

    const invoice = await getInvoiceById(id, schoolId);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    // Students can only access their own invoice
    if (role === "STUDENT" && invoice.enrollment.studentId !== userId) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this invoice",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Invoice fetched successfully",
      data: invoice,
    });
  } catch (error) {
    console.error("Get invoice error:", error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
