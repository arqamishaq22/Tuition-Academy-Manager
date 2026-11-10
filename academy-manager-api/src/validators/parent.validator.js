import { z } from "zod";

export const parentAttendanceQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2020).max(2100).optional(),
});

export const studentIdParamSchema = z.object({
  studentId: z.coerce.number().int().positive("Invalid student ID"),
});

export const feeReceiptParamSchema = z.object({
  studentId: z.coerce.number().int().positive("Invalid student ID"),
  feeId: z.coerce.number().int().positive("Invalid fee ID"),
});

export const reportCardParamSchema = z.object({
  studentId: z.coerce.number().int().positive("Invalid student ID"),
  examId: z.coerce.number().int().positive("Invalid exam ID"),
});

export const noticeIdParamSchema = z.object({
  id: z.coerce.number().int().positive("Invalid notice ID"),
});

// Route wrapper schemas
export const parentAttendanceRouteSchema = z.object({
  params: studentIdParamSchema,
  query: parentAttendanceQuerySchema,
});

export const studentOnlyRouteSchema = z.object({
  params: studentIdParamSchema,
});

export const feeReceiptRouteSchema = z.object({
  params: feeReceiptParamSchema,
});

export const reportCardRouteSchema = z.object({
  params: reportCardParamSchema,
});

export const noticeReadRouteSchema = z.object({
  params: noticeIdParamSchema,
});

export default {
  parentAttendanceQuerySchema,
  studentIdParamSchema,
  feeReceiptParamSchema,
  reportCardParamSchema,
  noticeIdParamSchema,
  parentAttendanceRouteSchema,
  studentOnlyRouteSchema,
  feeReceiptRouteSchema,
  reportCardRouteSchema,
  noticeReadRouteSchema,
};

