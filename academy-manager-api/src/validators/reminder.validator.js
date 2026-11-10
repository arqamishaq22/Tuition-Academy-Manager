import { z } from "zod";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const feePreviewSchema = z.object({
  feeIds: z.array(z.coerce.number().int().positive()).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2020).max(2100).optional(),
  classId: z.coerce.number().int().positive().optional(),
  status: z.enum(["pending", "partial", "overdue", "all"]).optional(),
});

export const feeSendSchema = z.object({
  feeIds: z.array(z.coerce.number().int().positive()).min(1, "At least one feeId must be provided"),
  force: z.boolean().default(false),
});

export const absentReminderSchema = z.object({
  date: z.string().regex(dateRegex, "Date must be YYYY-MM-DD").optional(),
  classId: z.coerce.number().int().positive().optional(),
});

export const paymentIdParamSchema = z.object({
  paymentId: z.coerce.number().int().positive("Invalid payment ID"),
});

export const examStudentParamSchema = z.object({
  examId: z.coerce.number().int().positive("Invalid exam ID"),
  studentId: z.coerce.number().int().positive("Invalid student ID"),
});

export const reminderLogsQuerySchema = z.object({
  date: z.string().regex(dateRegex, "Date must be YYYY-MM-DD").optional(),
  student: z.string().trim().optional(),
  status: z.enum(["queued", "sent", "failed"]).optional(),
  channel: z.enum(["whatsapp", "sms", "email"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const queueSendSchema = z.object({
  reminderIds: z.array(z.coerce.number().int().positive()).optional(),
});

// Route schemas
export const feePreviewRouteSchema = z.object({
  body: feePreviewSchema,
});

export const feeSendRouteSchema = z.object({
  body: feeSendSchema,
});

export const absentReminderRouteSchema = z.object({
  body: absentReminderSchema,
});

export const receiptParamRouteSchema = z.object({
  params: paymentIdParamSchema,
});

export const examStudentRouteSchema = z.object({
  params: examStudentParamSchema,
});

export const reminderLogsRouteSchema = z.object({
  query: reminderLogsQuerySchema,
});

export const queueSendRouteSchema = z.object({
  body: queueSendSchema.optional(),
});

export default {
  feePreviewSchema,
  feeSendSchema,
  absentReminderSchema,
  paymentIdParamSchema,
  examStudentParamSchema,
  reminderLogsQuerySchema,
  queueSendSchema,
  feePreviewRouteSchema,
  feeSendRouteSchema,
  absentReminderRouteSchema,
  receiptParamRouteSchema,
  examStudentRouteSchema,
  reminderLogsRouteSchema,
  queueSendRouteSchema,
};
