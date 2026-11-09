import { z } from "zod";

export const createExamSchema = z.object({
  name: z.string().min(2, "Exam name must be at least 2 characters").max(100),
  classId: z.coerce.number().int().positive(),
  subject: z.string().min(2).max(50),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date format must be YYYY-MM-DD"),
  totalMarks: z.coerce.number().positive(),
  passingMarks: z.coerce.number().positive(),
});

export const saveMarksSchema = z.object({
  examId: z.coerce.number().int().positive(),
  marks: z.array(
    z.object({
      studentId: z.coerce.number().int().positive(),
      obtainedMarks: z.coerce.number().nonnegative(),
    })
  ).min(1, "Marks array cannot be empty"),
});
