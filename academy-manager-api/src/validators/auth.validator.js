import { z } from "zod";

// Password rule: minimum 8 characters, at least one letter, and at least one number
const passwordRule = z
  .string({ required_error: "Password is required" })
  .min(8, "Password must be at least 8 characters long")
  .regex(
    /^(?=.*[A-Za-z])(?=.*\d)/,
    "Password must contain at least one letter and one number"
  );

export const signupSchema = z.object({
  name: z
    .string({ required_error: "Full name is required" })
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(100),
  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .email("Invalid email address format"),
  phone: z
    .string({ required_error: "Phone number is required" })
    .trim()
    .min(10, "Phone number must be at least 10 characters")
    .max(25),
  password: passwordRule,
  academyName: z
    .string({ required_error: "Academy name is required" })
    .trim()
    .min(3, "Academy name must be at least 3 characters")
    .max(150),
  city: z.string().trim().min(2).max(80).default("Lahore"),
  studentsRange: z.string().optional(),
  subjects: z.array(z.string().trim().min(1)).optional(),
});

export const loginSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .email("Invalid email address format"),
  password: z
    .string({ required_error: "Password is required" })
    .min(1, "Password cannot be empty"),
});

export const parentLoginSchema = z.object({
  phone: z
    .string({ required_error: "Phone number is required" })
    .trim()
    .min(10, "Phone number must be at least 10 digits"),
  password: z
    .string({ required_error: "Password is required" })
    .min(1, "Password cannot be empty"),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().optional(),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  phone: z.string().trim().min(10).max(25).optional(),
  avatarUrl: z.string().trim().max(255).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z
    .string({ required_error: "Current password is required" })
    .min(1, "Current password cannot be empty"),
  newPassword: passwordRule,
});

export const forgotPasswordSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .email("Invalid email address format"),
});

export const resetPasswordSchema = z.object({
  token: z
    .string({ required_error: "Reset token is required" })
    .min(1, "Reset token cannot be empty"),
  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .email("Invalid email address format"),
  newPassword: passwordRule,
});

export default {
  signupSchema,
  loginSchema,
  parentLoginSchema,
  refreshTokenSchema,
  updateProfileSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};
