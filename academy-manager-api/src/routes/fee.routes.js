import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { roleGuard } from "../middleware/roleGuard.js";
import { validate } from "../middleware/validate.js";
import { collectFeeSchema } from "../validators/fee.validator.js";
import feeController from "../controllers/fee.controller.js";

const router = Router();

router.use(authenticate);

router.get("/invoices", feeController.getFeeInvoices);
router.post(
  "/collect",
  roleGuard("admin", "owner", "staff"),
  validate(collectFeeSchema),
  feeController.collectFee
);
router.get("/receipts/:id", feeController.getReceipt);

export default router;

