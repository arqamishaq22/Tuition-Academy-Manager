import { z } from "zod";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Schema for creating a new examination with allocated subjects.
 * POST /api/v1/exams
 */
export const createExamSchema = z.object({
  classId: z.coerce
    .number({ required_error: "Class ID is required" })
    .int()
    .positive("Class ID must be a positive integer"),
  name: z
    .string({ required_error: "Exam name is required" })
    .trim()
    .min(2, "Exam name must be at least 2 characters")
    .max(100, "Exam name cannot exceed 100 characters"),
  examType: z
    .enum(["monthly", "mid_term", "final_term", "other"], {
      errorMap: () => ({ message: "Exam type must be monthly, mid_term, final_term, or other" }),
    })
    .default("monthly"),
  startDate: z
    .string({ required_error: "Start date is required" })
    .regex(dateRegex, "Start date format must be YYYY-MM-DD"),
  sessionLabel: z
    .string()
    .trim()
    .min(2, "Session label must be at least 2 characters")
    .max(30, "Session label cannot exceed 30 characters")
    .default("2026-27"),
  subjects: z
    .array(
      z
        .object({
          subjectId: z.coerce
            .number({ required_error: "subjectId is required" })
            .int()
            .positive("subjectId must be a positive integer"),
          totalMarks: z.coerce
            .number({ required_error: "totalMarks is required" })
            .int("totalMarks must be an integer")
            .positive("Total marks must be greater than 0"),
          passingMarks: z.coerce
            .number({ required_error: "passingMarks is required" })
            .int("passingMarks must be an integer")
            .positive("Passing marks must be greater than 0"),
        })
        .refine((s) => s.passingMarks <= s.totalMarks, {
          message: "Passing marks cannot be greater than total marks",
          path: ["passingMarks"],
        })
    )
    .min(1, "At least one subject must be assigned to the exam")
    .refine((arr) => new Set(arr.map((s) => s.subjectId)).size === arr.length, {
      message: "Duplicate subjects are not allowed in the same exam",
      path: ["subjects"],
    }),
});

/**
 * Schema for updating an existing examination header.
 * PUT /api/v1/exams/:id
 */
export const updateExamSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    examType: z.enum(["monthly", "mid_term", "final_term", "other"]).optional(),
    startDate: z.string().regex(dateRegex, "Start date format must be YYYY-MM-DD").optional(),
    sessionLabel: z.string().trim().min(2).max(30).optional(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.examType !== undefined ||
      data.startDate !== undefined ||
      data.sessionLabel !== undefined,
    {
      message: "At least one field (name, examType, startDate, sessionLabel) must be provided for update",
    }
  );

/**
 * Schema for bulk saving student marks for an exam subject.
 * POST /api/v1/exams/:id/marks
 */
export const saveMarksSchema = z.object({
  subjectId: z.coerce
    .number({ required_error: "subjectId is required" })
    .int()
    .positive("subjectId must be a positive integer"),
  records: z
    .array(
      z
        .object({
          studentId: z.coerce
            .number({ required_error: "studentId is required" })
            .int()
            .positive("studentId must be a positive integer"),
          marksObtained: z.coerce
            .number()
            .nonnegative("marksObtained must be non-negative")
            .nullable()
            .optional(),
          isAbsent: z.boolean().default(false),
        })
        .refine((r) => r.isAbsent || (r.marksObtained !== null && r.marksObtained !== undefined), {
          message: "marksObtained is required when student is not marked as absent",
          path: ["marksObtained"],
        })
    )
    .min(1, "At least one student mark record is required"),
});

/**
 * Schema for saving teacher remarks on a student's report card.
 * PUT /api/v1/exams/:id/remarks/:studentId
 */
export const saveRemarkSchema = z.object({
  remark: z
    .string({ required_error: "Remark is required" })
    .trim()
    .min(1, "Remark cannot be empty")
    .max(500, "Remark cannot exceed 500 characters"),
});

/**
 * Query schema for listing exams.
 * GET /api/v1/exams
 */
export const listExamsQuerySchema = z.object({
  classId: z.coerce.number().int().positive().optional(),
  status: z.enum(["upcoming", "marks_pending", "published", "all"]).optional(),
  session: z.string().trim().optional(),
  examType: z.enum(["monthly", "mid_term", "final_term", "other"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

/**
 * Query schema for viewing marks of a subject.
 * GET /api/v1/exams/:id/marks?subjectId=
 */
export const marksQuerySchema = z.object({
  subjectId: z.coerce
    .number({ required_error: "subjectId is required" })
    .int()
    .positive("subjectId must be a positive integer"),
});

// ============================================================================
// Multi-target route schemas for validate middleware
// ============================================================================

export const createExamRouteSchema = z.object({
  body: createExamSchema,
});

export const updateExamRouteSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive("Exam ID must be a positive integer"),
  }),
  body: updateExamSchema,
});

export const deleteExamRouteSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive("Exam ID must be a positive integer"),
  }),
  query: z.object({
    force: z.coerce.boolean().optional(),
  }),
});

export const getExamDetailsRouteSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive("Exam ID must be a positive integer"),
  }),
});

export const getMarksRouteSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive("Exam ID must be a positive integer"),
  }),
  query: marksQuerySchema,
});

export const saveMarksRouteSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive("Exam ID must be a positive integer"),
  }),
  body: saveMarksSchema,
});

export const publishExamRouteSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive("Exam ID must be a positive integer"),
  }),
});

export const getResultsRouteSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive("Exam ID must be a positive integer"),
  }),
});

export const getReportCardRouteSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive("Exam ID must be a positive integer"),
    studentId: z.coerce.number().int().positive("Student ID must be a positive integer"),
  }),
});

export const saveRemarkRouteSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive("Exam ID must be a positive integer"),
    studentId: z.coerce.number().int().positive("Student ID must be a positive integer"),
  }),
  body: saveRemarkSchema,
});

export const studentResultsRouteSchema = z.object({
  params: z.object({
    studentId: z.coerce.number().int().positive("Student ID must be a positive integer"),
  }),
});

export default {
  createExamSchema,
  updateExamSchema,
  saveMarksSchema,
  saveRemarkSchema,
  listExamsQuerySchema,
  marksQuerySchema,
  createExamRouteSchema,
  updateExamRouteSchema,
  deleteExamRouteSchema,
  getExamDetailsRouteSchema,
  getMarksRouteSchema,
  saveMarksRouteSchema,
  publishExamRouteSchema,
  getResultsRouteSchema,
  getReportCardRouteSchema,
  saveRemarkRouteSchema,
  studentResultsRouteSchema,
};
