import { z } from "zod";

export const createStudentSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters").max(100),
  fatherName: z.string().min(2, "Father's name must be at least 2 characters").max(100),
  rollNumber: z.string().min(1, "Roll number is required").max(30),
  classId: z.coerce.number().int().positive("Valid class ID is required"),
  phone: z.string().min(10, "Phone number must be at least 10 digits").max(20),
  parentPhone: z.string().min(10, "Parent phone number must be at least 10 digits").max(20),
  address: z.string().max(255).optional(),
  monthlyFee: z.coerce.number().nonnegative("Monthly fee must be 0 or positive"),
  admissionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format must be YYYY-MM-DD").optional(),
});

export const updateStudentSchema = createStudentSchema.partial();
