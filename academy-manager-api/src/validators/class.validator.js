import { z } from "zod";

export const createClassSchema = z.object({
  name: z.string().min(2, "Class name must be at least 2 characters").max(50),
  batch: z.string().max(50).optional(),
  shift: z.enum(["Morning", "Evening", "Afternoon"]).default("Evening"),
  roomNumber: z.string().max(20).optional(),
  maxCapacity: z.coerce.number().int().positive().default(40),
  monthlyFee: z.coerce.number().nonnegative().default(3500),
  teacherName: z.string().max(100).optional(),
});

export const updateClassSchema = createClassSchema.partial();
