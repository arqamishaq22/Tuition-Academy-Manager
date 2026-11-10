import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { roleGuard } from "../middleware/roleGuard.js";
import { validate } from "../middleware/validate.js";
import {
  generateFeesRouteSchema,
  collectPaymentRouteSchema,
  listFeesRouteSchema,
  summaryRouteSchema,
  listPaymentsRouteSchema,
  receiptRouteSchema,
  reversalRouteSchema,
  adjustFeeRouteSchema,
  defaultersRouteSchema,
  exportRouteSchema,
  studentFeeHistoryRouteSchema,
  feeStructureRouteSchema,
} from "../validators/fee.validator.js";
import feeController from "../controllers/fee.controller.js";

const router = Router();

// Authentication required for all fee endpoints
router.use(authenticate);

// Global module access: Owner and Staff only. Teachers and Parents are blocked.
router.use(roleGuard("owner", "staff"));

// 1. POST /generate - Bulk generate monthly fee invoices
router.post(
  "/generate",
  validate(generateFeesRouteSchema),
  feeController.generateMonthlyFees
);

// 2. GET /summary - Monthly collection summary and metrics
router.get(
  "/summary",
  validate(summaryRouteSchema),
  feeController.getFeeSummary
);

// 3. GET /defaulters - Defaulters list across months
router.get(
  "/defaulters",
  validate(defaultersRouteSchema),
  feeController.getDefaulters
);

// 4. GET /export - CSV export of the fee ledger
router.get(
  "/export",
  validate(exportRouteSchema),
  feeController.exportFeesCsv
);

// 5. GET & PUT /structure - Monthly fee structure by class
router.get(
  "/structure",
  feeController.getFeeStructure
);

router.put(
  "/structure",
  validate(feeStructureRouteSchema),
  feeController.updateFeeStructure
);

// 6. GET /student/:studentId - Full student billing ledger and payments
router.get(
  "/student/:studentId",
  validate(studentFeeHistoryRouteSchema),
  feeController.getStudentFeeHistory
);

// 7. POST /payments - Collect fee payment (single or multi-month allocation)
router.post(
  "/payments",
  validate(collectPaymentRouteSchema),
  feeController.collectPayment
);

// 8. GET /payments - List payments with range totals
router.get(
  "/payments",
  validate(listPaymentsRouteSchema),
  feeController.getPaymentsList
);

// 9. GET /payments/:id/receipt - Receipt print payload
router.get(
  "/payments/:id/receipt",
  validate(receiptRouteSchema),
  feeController.getReceiptDetails
);

// 10. DELETE /payments/:id - Payment reversal (strictly Owner only)
router.delete(
  "/payments/:id",
  roleGuard("owner"),
  validate(reversalRouteSchema),
  feeController.reversePayment
);

// 11. PATCH /:id - Fee adjustment (strictly Owner only)
router.patch(
  "/:id",
  roleGuard("owner"),
  validate(adjustFeeRouteSchema),
  feeController.adjustFee
);

// 12. GET / - List fee records with filters and pagination
router.get(
  "/",
  validate(listFeesRouteSchema),
  feeController.getFeesList
);

export default router;
