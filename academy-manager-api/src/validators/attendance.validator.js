import { z } from "zod";

export const markAttendanceSchema = z.object({
  classId: z.coerce.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date format must be YYYY-MM-DD"),
  records: z.array(
    z.object({
      studentId: z.coerce.number().int().positive(),
      status: z.enum(["Present", "Absent", "Late", "Leave"]),
      remarks: z.string().max(255).optional(),
    })
  ).min(1, "Attendance records cannot be empty"),
});
