import { z } from "zod";

export const createNoticeSchema = z
  .object({
    title: z.string().trim().min(3, "Title must be at least 3 characters").max(150, "Title cannot exceed 150 characters"),
    body: z.string().trim().min(5, "Notice body must be at least 5 characters"),
    audience: z.enum(["all", "parents", "teachers", "class"], {
      errorMap: () => ({ message: "Audience must be one of: 'all', 'parents', 'teachers', 'class'" }),
    }).default("all"),
    classId: z.coerce.number().int().positive("Class ID must be a positive integer").optional().nullable(),
    isPinned: z.boolean().default(false),
  })
  .refine(
    (data) => {
      if (data.audience === "class" && !data.classId) {
        return false;
      }
      return true;
    },
    {
      message: "classId is required when audience is set to 'class'",
      path: ["classId"],
    }
  );

export const updateNoticeSchema = z
  .object({
    title: z.string().trim().min(3).max(150).optional(),
    body: z.string().trim().min(5).optional(),
    audience: z.enum(["all", "parents", "teachers", "class"]).optional(),
    classId: z.coerce.number().int().positive().optional().nullable(),
    isPinned: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.audience === "class" && !data.classId) {
        return false;
      }
      return true;
    },
    {
      message: "classId is required when audience is set to 'class'",
      path: ["classId"],
    }
  );

export const noticeQuerySchema = z.object({
  audience: z.enum(["all", "parents", "teachers", "class"]).optional(),
  classId: z.coerce.number().int().positive().optional(),
  q: z.string().trim().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const noticeIdParamSchema = z.object({
  id: z.coerce.number().int().positive("Invalid notice ID"),
});

export const pinNoticeSchema = z.object({
  isPinned: z.boolean().optional(),
});

// Route schemas for validate middleware
export const createNoticeRouteSchema = z.object({
  body: createNoticeSchema,
});

export const updateNoticeRouteSchema = z.object({
  params: noticeIdParamSchema,
  body: updateNoticeSchema,
});

export const getNoticesRouteSchema = z.object({
  query: noticeQuerySchema,
});

export const getNoticeIdRouteSchema = z.object({
  params: noticeIdParamSchema,
});

export const pinNoticeRouteSchema = z.object({
  params: noticeIdParamSchema,
  body: pinNoticeSchema.optional(),
});

export default {
  createNoticeSchema,
  updateNoticeSchema,
  noticeQuerySchema,
  noticeIdParamSchema,
  pinNoticeSchema,
  createNoticeRouteSchema,
  updateNoticeRouteSchema,
  getNoticesRouteSchema,
  getNoticeIdRouteSchema,
  pinNoticeRouteSchema,
};

