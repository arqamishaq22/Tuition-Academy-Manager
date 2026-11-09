import { z } from "zod";
import { isValidPakistaniPhone, normalizePakistaniPhone } from "../utils/phone.js";

const pakistaniPhoneSchema = z
  .string({ required_error: "Teacher phone is required" })
  .trim()
  .refine(
    (val) => isValidPakistaniPhone(val),
    { message: "Must be a valid 11-digit Pakistani mobile number (e.g. 03001234567 or 0300-1234567)" }
  )
  .transform((val) => normalizePakistaniPhone(val));

export const createTeacherSchema = z.object({
  name: z
    .string({ required_error: "Teacher name is required" })
    .trim()
    .min(2, "Teacher name must be at least 2 characters")
    .max(100),
  phone: pakistaniPhoneSchema,
  email: z.string().trim().email("Invalid email format").optional().nullable(),
  qualification: z.string().trim().max(100).optional().nullable(),
  subject: z.string().trim().max(100).optional().nullable(),
  salary: z.coerce.number().int().nonnegative().optional().nullable(),
  joinedOn: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Joined on date format must be YYYY-MM-DD")
    .default(() => new Date().toISOString().slice(0, 10)),
  createAccount: z.boolean().default(false),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
});

export const updateTeacherSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  phone: pakistaniPhoneSchema.optional(),
  email: z.string().trim().email("Invalid email format").optional().nullable(),
  qualification: z.string().trim().max(100).optional().nullable(),
  subject: z.string().trim().max(100).optional().nullable(),
  salary: z.coerce.number().int().nonnegative().optional().nullable(),
  joinedOn: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Joined on date format must be YYYY-MM-DD")
    .optional(),
  isActive: z.boolean().optional(),
});

export default {
  createTeacherSchema,
  updateTeacherSchema,
};

