import { z } from "zod";

export const registerSchema = z.object({
  academyName: z
    .string({ required_error: "Academy name is required" })
    .min(3, "Academy name must be at least 3 characters")
    .max(100),
  fullName: z
    .string({ required_error: "Full name is required" })
    .min(2, "Full name must be at least 2 characters")
    .max(100),
  email: z
    .string({ required_error: "Email is required" })
    .email("Invalid email address format"),
  password: z
    .string({ required_error: "Password is required" })
    .min(6, "Password must be at least 6 characters long"),
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(20)
    .optional(),
  city: z.string().default("Lahore"),
});

export const loginSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .email("Invalid email address format"),
  password: z
    .string({ required_error: "Password is required" })
    .min(1, "Password cannot be empty"),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().optional(),
});
