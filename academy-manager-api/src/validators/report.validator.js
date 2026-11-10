import { z } from "zod";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const feeCollectionReportQuerySchema = z.object({
  from: z.string().regex(dateRegex, "from date must be YYYY-MM-DD").optional(),
  to: z.string().regex(dateRegex, "to date must be YYYY-MM-DD").optional(),
  classId: z.coerce.number().int().positive().optional(),
  groupBy: z.enum(["day", "month"]).default("day"),
  format: z.enum(["json", "csv"]).default("json"),
});

export const outstandingReportQuerySchema = z.object({
  classId: z.coerce.number().int().positive().optional(),
  format: z.enum(["json", "csv"]).default("json"),
});

export const attendanceReportQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2020).max(2100).optional(),
  classId: z.coerce.number().int().positive().optional(),
  format: z.enum(["json", "csv"]).default("json"),
});

export const studentStrengthReportQuerySchema = z.object({
  format: z.enum(["json", "csv"]).default("json"),
});

export const incomeVsSalaryReportQuerySchema = z.object({
  year: z.coerce.number().int().min(2020).max(2100).optional(),
  format: z.enum(["json", "csv"]).default("json"),
});

export const classPerformanceReportQuerySchema = z.object({
  examId: z.coerce.number().int().positive().optional(),
  classId: z.coerce.number().int().positive().optional(),
  format: z.enum(["json", "csv"]).default("json"),
});

// Route schemas for validate middleware
export const feeCollectionRouteSchema = z.object({
  query: feeCollectionReportQuerySchema,
});

export const outstandingRouteSchema = z.object({
  query: outstandingReportQuerySchema,
});

export const attendanceRouteSchema = z.object({
  query: attendanceReportQuerySchema,
});

export const studentStrengthRouteSchema = z.object({
  query: studentStrengthReportQuerySchema,
});

export const incomeVsSalaryRouteSchema = z.object({
  query: incomeVsSalaryReportQuerySchema,
});

export const classPerformanceRouteSchema = z.object({
  query: classPerformanceReportQuerySchema,
});

export default {
  feeCollectionReportQuerySchema,
  outstandingReportQuerySchema,
  attendanceReportQuerySchema,
  studentStrengthReportQuerySchema,
  incomeVsSalaryReportQuerySchema,
  classPerformanceReportQuerySchema,
  feeCollectionRouteSchema,
  outstandingRouteSchema,
  attendanceRouteSchema,
  studentStrengthRouteSchema,
  incomeVsSalaryRouteSchema,
  classPerformanceRouteSchema,
};

