import { z } from "zod";

export const collectFeeSchema = z.object({
  studentId: z.coerce.number().int().positive(),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  month: z.string().min(3).max(20), // e.g. "November 2026"
  paymentMethod: z.enum(["Cash", "JazzCash", "Easypaisa", "Bank Transfer"]).default("Cash"),
  note: z.string().max(255).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date format must be YYYY-MM-DD").optional(),
});
