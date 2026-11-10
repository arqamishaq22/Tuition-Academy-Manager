import { z } from "zod";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Base schema for bulk monthly fee generation.
 */
export const generateFeesSchema = z.object({
  month: z.coerce
    .number({ required_error: "Month is required" })
    .int("Month must be an integer")
    .min(1, "Month must be between 1 and 12")
    .max(12, "Month must be between 1 and 12"),
  year: z.coerce
    .number({ required_error: "Year is required" })
    .int("Year must be an integer")
    .min(2020, "Year must be 2020 or later")
    .max(2100, "Year must be 2100 or earlier"),
  classId: z.coerce
    .number()
    .int()
    .positive("classId must be a positive integer")
    .optional(),
});

/**
 * Base schema for collecting fee payments (single fee or multi-month allocation).
 */
export const collectPaymentSchema = z
  .object({
    feeId: z.coerce.number().int().positive().optional(),
    studentId: z.coerce.number().int().positive().optional(),
    month: z.coerce.number().int().min(1).max(12).optional(),
    year: z.coerce.number().int().min(2020).max(2100).optional(),
    amount: z.coerce
      .number({ required_error: "Payment amount is required" })
      .int("Amount must be a whole PKR integer")
      .positive("Amount must be greater than 0"),
    method: z
      .enum(["cash", "jazzcash", "easypaisa", "bank_transfer"], {
        errorMap: () => ({ message: "Method must be cash, jazzcash, easypaisa, or bank_transfer" }),
      })
      .default("cash"),
    paidOn: z
      .string()
      .regex(dateRegex, "paidOn must be in YYYY-MM-DD format")
      .optional(),
    note: z.string().trim().max(255).optional().nullable(),
  })
  .refine((data) => data.feeId || data.studentId, {
    message: "Either feeId or studentId must be provided.",
    path: ["feeId"],
  });

/**
 * Base schema for payment reversal (owner only).
 */
export const reversalSchema = z.object({
  reason: z
    .string({ required_error: "Reason is required for reversal" })
    .trim()
    .min(3, "Reason must be at least 3 characters")
    .max(255, "Reason cannot exceed 255 characters"),
});

/**
 * Base schema for fee adjustment (owner only).
 */
export const adjustFeeSchema = z
  .object({
    amount: z.coerce
      .number()
      .int("Amount must be a whole PKR integer")
      .nonnegative("Amount cannot be negative")
      .optional(),
    discount: z.coerce
      .number()
      .int("Discount must be a whole PKR integer")
      .nonnegative("Discount cannot be negative")
      .optional(),
    lateFee: z.coerce
      .number()
      .int("Late fee must be a whole PKR integer")
      .nonnegative("Late fee cannot be negative")
      .optional(),
    dueDate: z
      .string()
      .regex(dateRegex, "dueDate must be in YYYY-MM-DD format")
      .optional(),
    note: z.string().trim().max(255).optional().nullable(),
  })
  .refine(
    (data) =>
      data.amount !== undefined ||
      data.discount !== undefined ||
      data.lateFee !== undefined ||
      data.dueDate !== undefined ||
      data.note !== undefined,
    {
      message: "At least one adjustment field (amount, discount, lateFee, dueDate, note) must be provided.",
    }
  );

/**
 * Base schema for fee structure updates.
 */
export const feeStructureSchema = z.object({
  updates: z
    .array(
      z.object({
        classId: z.coerce
          .number({ required_error: "classId is required" })
          .int()
          .positive("classId must be a positive integer"),
        monthlyFee: z.coerce
          .number({ required_error: "monthlyFee is required" })
          .int("monthlyFee must be a whole integer")
          .nonnegative("monthlyFee cannot be negative"),
      })
    )
    .min(1, "At least one class fee update is required"),
  applyToActiveStudents: z.boolean().default(false),
  fromMonth: z.coerce.number().int().min(1).max(12).optional(),
  fromYear: z.coerce.number().int().min(2020).max(2100).optional(),
});

/**
 * Query schema for listing fees.
 */
export const listFeesQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2020).max(2100).optional(),
  classId: z.coerce.number().int().positive().optional(),
  status: z.enum(["pending", "partial", "paid", "overdue", "all"]).optional(),
  q: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  sortBy: z
    .enum(["student_name", "roll_no", "due_date", "amount", "paid_amount", "balance", "created_at", "status"])
    .optional(),
  order: z.enum(["asc", "desc", "ASC", "DESC"]).optional(),
});

/**
 * Query schema for fee summary.
 */
export const summaryQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2020).max(2100).optional(),
});

/**
 * Query schema for payments list.
 */
export const listPaymentsQuerySchema = z.object({
  startDate: z.string().regex(dateRegex, "startDate must be YYYY-MM-DD").optional(),
  endDate: z.string().regex(dateRegex, "endDate must be YYYY-MM-DD").optional(),
  method: z.enum(["cash", "jazzcash", "easypaisa", "bank_transfer"]).optional(),
  studentId: z.coerce.number().int().positive().optional(),
  q: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

/**
 * Query schema for defaulters list.
 */
export const defaultersQuerySchema = z.object({
  minMonths: z.coerce.number().int().min(1).default(1),
});

/**
 * Query schema for exporting fee ledger CSV.
 */
export const exportQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2020).max(2100).optional(),
});

// ============================================================================
// Multi-target route validation schemas (compatible with validate middleware)
// ============================================================================

export const generateFeesRouteSchema = z.object({
  body: generateFeesSchema,
});

export const collectPaymentRouteSchema = z.object({
  body: collectPaymentSchema,
});

export const listFeesRouteSchema = z.object({
  query: listFeesQuerySchema,
});

export const summaryRouteSchema = z.object({
  query: summaryQuerySchema,
});

export const listPaymentsRouteSchema = z.object({
  query: listPaymentsQuerySchema,
});

export const receiptRouteSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive("Receipt ID must be a positive integer"),
  }),
});

export const reversalRouteSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive("Payment ID must be a positive integer"),
  }),
  body: reversalSchema,
});

export const adjustFeeRouteSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive("Fee ID must be a positive integer"),
  }),
  body: adjustFeeSchema,
});

export const defaultersRouteSchema = z.object({
  query: defaultersQuerySchema,
});

export const exportRouteSchema = z.object({
  query: exportQuerySchema,
});

export const studentFeeHistoryRouteSchema = z.object({
  params: z.object({
    studentId: z.coerce.number().int().positive("Student ID must be a positive integer"),
  }),
});

export const feeStructureRouteSchema = z.object({
  body: feeStructureSchema,
});

export default {
  generateFeesSchema,
  collectPaymentSchema,
  reversalSchema,
  adjustFeeSchema,
  feeStructureSchema,
  listFeesQuerySchema,
  summaryQuerySchema,
  listPaymentsQuerySchema,
  defaultersQuerySchema,
  exportQuerySchema,
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
};
