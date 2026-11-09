import { z } from "zod";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const markAttendanceSchema = z.object({
  classId: z.coerce
    .number({ required_error: "Class ID is required" })
    .int()
    .positive("Class ID must be a positive integer"),
  date: z
    .string({ required_error: "Date is required" })
    .regex(dateRegex, "Date format must be YYYY-MM-DD"),
  records: z
    .array(
      z.object({
        studentId: z.coerce
          .number({ required_error: "Student ID is required" })
          .int()
          .positive("Student ID must be a positive integer"),
        status: z.enum(["present", "absent", "late", "leave"], {
          required_error: "Status is required and must be present, absent, late, or leave",
        }),
        note: z.string().trim().max(255).optional().nullable(),
      })
    )
    .min(1, "At least one student attendance record is required"),
});

export const updateAttendanceSchema = z.object({
  status: z.enum(["present", "absent", "late", "leave"], {
    required_error: "Status is required and must be present, absent, late, or leave",
  }),
  note: z.string().trim().max(255).optional().nullable(),
});

export const classAttendanceQuerySchema = z.object({
  date: z.string().regex(dateRegex, "Date format must be YYYY-MM-DD").optional(),
});

export const historyQuerySchema = z.object({
  classId: z.coerce
    .number({ required_error: "classId is required" })
    .int()
    .positive(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2020).max(2050).optional(),
});

export const dayAttendanceQuerySchema = z.object({
  classId: z.coerce
    .number({ required_error: "classId is required" })
    .int()
    .positive(),
  date: z
    .string({ required_error: "date is required" })
    .regex(dateRegex, "Date format must be YYYY-MM-DD"),
});

export const studentAttendanceQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2020).max(2050).optional(),
});

export const monthlyReportQuerySchema = z.object({
  classId: z.coerce
    .number({ required_error: "classId is required" })
    .int()
    .positive(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2020).max(2050).optional(),
});

export const absenteesQuerySchema = z.object({
  date: z.string().regex(dateRegex, "Date format must be YYYY-MM-DD").optional(),
});

// Multi-target route validators
export const classAttendanceRouteSchema = z.object({
  params: z.object({ classId: z.coerce.number().int().positive() }),
  query: classAttendanceQuerySchema,
});

export const historyRouteSchema = z.object({
  query: historyQuerySchema,
});

export const dayAttendanceRouteSchema = z.object({
  query: dayAttendanceQuerySchema,
});

export const studentAttendanceRouteSchema = z.object({
  params: z.object({ studentId: z.coerce.number().int().positive() }),
  query: studentAttendanceQuerySchema,
});

export const monthlyReportRouteSchema = z.object({
  query: monthlyReportQuerySchema,
});

export const absenteesRouteSchema = z.object({
  query: absenteesQuerySchema,
});

export const patchAttendanceRouteSchema = z.object({
  params: z.object({ id: z.coerce.number().int().positive() }),
  body: updateAttendanceSchema,
});

export default {
  markAttendanceSchema,
  updateAttendanceSchema,
  classAttendanceQuerySchema,
  historyQuerySchema,
  dayAttendanceQuerySchema,
  studentAttendanceQuerySchema,
  monthlyReportQuerySchema,
  absenteesQuerySchema,
  classAttendanceRouteSchema,
  historyRouteSchema,
  dayAttendanceRouteSchema,
  studentAttendanceRouteSchema,
  monthlyReportRouteSchema,
  absenteesRouteSchema,
  patchAttendanceRouteSchema,
};
