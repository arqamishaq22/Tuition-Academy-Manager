import { z } from "zod";
import { isValidPakistaniPhone, normalizePakistaniPhone } from "../utils/phone.js";

// Custom Zod validator for Pakistani phone
const pakistaniPhoneSchema = z
  .string({ required_error: "Parent phone is required" })
  .trim()
  .refine(
    (val) => isValidPakistaniPhone(val),
    { message: "Must be a valid 11-digit Pakistani mobile number (e.g. 03001234567 or 0300-1234567)" }
  )
  .transform((val) => normalizePakistaniPhone(val));

const optionalPhoneSchema = z
  .string()
  .trim()
  .optional()
  .refine(
    (val) => !val || isValidPakistaniPhone(val),
    { message: "Must be a valid 11-digit Pakistani mobile number (e.g. 03001234567)" }
  )
  .transform((val) => (val ? normalizePakistaniPhone(val) : null));

export const createStudentSchema = z.object({
  name: z
    .string({ required_error: "Student name is required" })
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100),
  fatherName: z
    .string({ required_error: "Father name is required" })
    .trim()
    .min(2, "Father name must be at least 2 characters")
    .max(100),
  classId: z.coerce
    .number({ required_error: "Class ID is required" })
    .int()
    .positive("Class ID must be a positive integer"),
  parentPhone: pakistaniPhoneSchema,
  phone: optionalPhoneSchema,
  rollNo: z.string().trim().max(30).optional(),
  gender: z.enum(["male", "female", "other"]).default("male"),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date of birth format must be YYYY-MM-DD")
    .optional()
    .nullable(),
  address: z.string().trim().max(255).optional().nullable(),
  monthlyFee: z.coerce.number().int().nonnegative().optional(),
  discount: z.coerce.number().int().nonnegative().default(0),
  admissionDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Admission date format must be YYYY-MM-DD")
    .optional(),
  status: z.enum(["active", "inactive", "left"]).default("active"),
});

export const updateStudentSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  fatherName: z.string().trim().min(2).max(100).optional(),
  classId: z.coerce.number().int().positive().optional(),
  parentPhone: pakistaniPhoneSchema.optional(),
  phone: optionalPhoneSchema.optional(),
  rollNo: z.string().trim().max(30).optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date of birth format must be YYYY-MM-DD")
    .optional()
    .nullable(),
  address: z.string().trim().max(255).optional().nullable(),
  monthlyFee: z.coerce.number().int().nonnegative().optional(),
  discount: z.coerce.number().int().nonnegative().optional(),
  admissionDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Admission date format must be YYYY-MM-DD")
    .optional(),
  status: z.enum(["active", "inactive", "left"]).optional(),
});

export const promoteStudentSchema = z.object({
  targetClassId: z.coerce
    .number({ required_error: "Target class ID is required" })
    .int()
    .positive(),
});

export const promoteClassSchema = z.object({
  currentClassId: z.coerce
    .number({ required_error: "Current class ID is required" })
    .int()
    .positive(),
  targetClassId: z.coerce
    .number({ required_error: "Target class ID is required" })
    .int()
    .positive(),
});

export default {
  createStudentSchema,
  updateStudentSchema,
  promoteStudentSchema,
  promoteClassSchema,
};
