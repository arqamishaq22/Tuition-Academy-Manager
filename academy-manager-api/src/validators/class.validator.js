import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/;

export const createClassSchema = z.object({
  name: z
    .string({ required_error: "Class name is required" })
    .trim()
    .min(2, "Class name must be at least 2 characters")
    .max(100),
  section: z.string().trim().max(30).optional().nullable(),
  timingStart: z
    .string({ required_error: "Start timing is required (e.g. 16:00)" })
    .regex(timeRegex, "Start timing must be in HH:MM or HH:MM:SS format"),
  timingEnd: z
    .string({ required_error: "End timing is required (e.g. 18:00)" })
    .regex(timeRegex, "End timing must be in HH:MM or HH:MM:SS format"),
  daysOfWeek: z
    .string()
    .trim()
    .max(50)
    .default("Mon,Tue,Wed,Thu,Fri,Sat"),
  monthlyFee: z.coerce
    .number()
    .int()
    .nonnegative("Monthly fee must be 0 or positive")
    .default(3500),
  teacherId: z.coerce.number().int().positive().optional().nullable(),
  capacity: z.coerce
    .number()
    .int()
    .positive("Capacity must be at least 1")
    .default(40),
});

export const updateClassSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  section: z.string().trim().max(30).optional().nullable(),
  timingStart: z.string().regex(timeRegex, "Start timing format HH:MM").optional(),
  timingEnd: z.string().regex(timeRegex, "End timing format HH:MM").optional(),
  daysOfWeek: z.string().trim().max(50).optional(),
  monthlyFee: z.coerce.number().int().nonnegative().optional(),
  teacherId: z.coerce.number().int().positive().optional().nullable(),
  capacity: z.coerce.number().int().positive().optional(),
});

export const assignSubjectSchema = z.object({
  subjectId: z.coerce
    .number({ required_error: "Subject ID is required" })
    .int()
    .positive(),
  teacherId: z.coerce.number().int().positive().optional().nullable(),
});

export const createSubjectSchema = z.object({
  name: z
    .string({ required_error: "Subject name is required" })
    .trim()
    .min(2, "Subject name must be at least 2 characters")
    .max(100),
});

export default {
  createClassSchema,
  updateClassSchema,
  assignSubjectSchema,
  createSubjectSchema,
};
