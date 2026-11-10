import { z } from "zod";
import { normalizePakistaniPhone } from "../utils/phone.js";

const allowedPlaceholders = new Set(["student", "amount", "dueDate", "month", "academy"]);

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(3, "Academy name must be at least 3 characters").max(150),
  address: z.string().trim().max(255).optional().nullable(),
  city: z.string().trim().min(2).max(80).default("Lahore"),
  phone: z.string().trim().min(8).max(25).optional().nullable(),
  email: z.string().trim().email("Invalid academy email address").optional().nullable(),
});

export const feeSettingsSchema = z.object({
  feeDueDay: z.coerce.number().int().min(1, "Fee due day must be between 1 and 28").max(28, "Fee due day must be between 1 and 28"),
  lateFeeEnabled: z.boolean().default(false),
  lateFeeAmount: z.coerce.number().int().min(0, "Late fee amount cannot be negative").default(0),
  reminderTemplate: z
    .string()
    .trim()
    .min(10, "Reminder template must be at least 10 characters")
    .refine(
      (template) => {
        const regex = /\{([^}]+)\}/g;
        let match;
        while ((match = regex.exec(template)) !== null) {
          const varName = match[1];
          if (!allowedPlaceholders.has(varName)) {
            return false;
          }
        }
        return true;
      },
      {
        message: "Reminder template may only use allowed variables: {student}, {amount}, {dueDate}, {month}, {academy}",
      }
    ),
});

export const notificationSettingsSchema = z.object({
  whatsappReminders: z.boolean().default(true),
  absentAlerts: z.boolean().default(true),
  weeklyReports: z.boolean().default(false),
});

export const teamInviteSchema = z.object({
  name: z.string().trim().min(3, "Name must be at least 3 characters").max(100),
  email: z.string().trim().email("Invalid email address"),
  phone: z.string().trim().min(10, "Phone number must be at least 10 digits"),
  role: z.enum(["teacher", "staff"], {
    errorMap: () => ({ message: "Invited role must be either 'teacher' or 'staff'" }),
  }),
  subject: z.string().trim().max(100).optional().nullable(),
  qualification: z.string().trim().max(100).optional().nullable(),
  salary: z.coerce.number().int().min(0).optional().nullable(),
});

export const teamUpdateSchema = z.object({
  role: z.enum(["owner", "teacher", "staff"]).optional(),
  isActive: z.boolean().optional(),
});

export const userIdParamSchema = z.object({
  userId: z.coerce.number().int().positive("Invalid user ID"),
});

// Route schemas
export const profileUpdateRouteSchema = z.object({
  body: profileUpdateSchema,
});

export const feeSettingsRouteSchema = z.object({
  body: feeSettingsSchema,
});

export const notificationSettingsRouteSchema = z.object({
  body: notificationSettingsSchema,
});

export const teamInviteRouteSchema = z.object({
  body: teamInviteSchema,
});

export const teamUpdateRouteSchema = z.object({
  params: userIdParamSchema,
  body: teamUpdateSchema,
});

export const teamDeleteRouteSchema = z.object({
  params: userIdParamSchema,
});

export default {
  profileUpdateSchema,
  feeSettingsSchema,
  notificationSettingsSchema,
  teamInviteSchema,
  teamUpdateSchema,
  userIdParamSchema,
  profileUpdateRouteSchema,
  feeSettingsRouteSchema,
  notificationSettingsRouteSchema,
  teamInviteRouteSchema,
  teamUpdateRouteSchema,
  teamDeleteRouteSchema,
};

