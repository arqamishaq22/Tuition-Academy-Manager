import { z } from "zod";

export const feesTrendQuerySchema = z.object({
  months: z.coerce.number().int().min(1).max(24).default(6),
});

export const feeStatusQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2020).max(2100).optional(),
});

export const feesDueQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(90).default(7),
});

export const recentActivityQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

// Route schemas for validate middleware
export const feesTrendRouteSchema = z.object({
  query: feesTrendQuerySchema,
});

export const feeStatusRouteSchema = z.object({
  query: feeStatusQuerySchema,
});

export const feesDueRouteSchema = z.object({
  query: feesDueQuerySchema,
});

export const recentActivityRouteSchema = z.object({
  query: recentActivityQuerySchema,
});

export default {
  feesTrendQuerySchema,
  feeStatusQuerySchema,
  feesDueQuerySchema,
  recentActivityQuerySchema,
  feesTrendRouteSchema,
  feeStatusRouteSchema,
  feesDueRouteSchema,
  recentActivityRouteSchema,
};
