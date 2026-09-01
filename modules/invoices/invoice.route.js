import express from "express";

import {
  createInvoiceController,
  generateClassInvoicesController,
  getInvoicesController,
  getMyInvoicesController,
  getInvoiceByIdController,
} from "./invoice.controller.js";

import {
  validateCreateInvoice,
  validateGenerateClassInvoices,
  validateGetInvoices,
} from "./invoice.validation.js";

import { protect } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/authorization.middleware.js";

const router = express.Router();

// ======================================================
// STUDENT ROUTES
// ======================================================

// Student can view their own invoices
router.get("/my", protect, authorize("STUDENT"), getMyInvoicesController);

// ======================================================
// ADMIN ROUTES
// ======================================================

// Create a single invoice
router.post(
  "/",
  protect,
  authorize("ADMIN"),
  validateCreateInvoice,
  createInvoiceController,
);

// Generate invoices for every student in a class
router.post(
  "/generate-class",
  protect,
  authorize("ADMIN"),
  validateGenerateClassInvoices,
  generateClassInvoicesController,
);

// Admin can list/filter all invoices
router.get(
  "/",
  protect,
  authorize("ADMIN"),
  validateGetInvoices,
  getInvoicesController,
);

// ======================================================
// SINGLE INVOICE
// ======================================================

// IMPORTANT:
// This must come AFTER /my and /generate-class
router.get(
  "/:id",
  protect,
  authorize("ADMIN", "STUDENT"),
  getInvoiceByIdController,
);

export default router;
