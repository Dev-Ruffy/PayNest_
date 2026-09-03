import { z } from "zod";

export const createSchoolSchema = z.object({
  body: z.object({
    registrantName: z.string().min(2),
    registrantDesignation: z.enum(["Principal", "Head of School", "Admin"]),
    schoolName: z.string().min(2),
    schoolEmail: z.string().email(),
    username: z.string().min(4).max(32),
    password: z.string().min(8),
    autoActivate: z.boolean().optional().default(false),
  }),
});

export const rejectSchoolSchema = z.object({
  body: z.object({
    reason: z.string().max(300).optional(),
  }),
});

export const updateSettingSchema = z.object({
  body: z.object({
    value: z.string().min(1),
  }),
  params: z.object({
    key: z.string().min(1),
  }),
});
