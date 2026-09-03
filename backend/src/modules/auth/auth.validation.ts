import { z } from "zod";

export const registerSchoolSchema = z.object({
  body: z.object({
    registrantName: z.string().min(2, "Full name is required"),
    registrantDesignation: z.enum(["Principal", "Head of School", "Admin"]),
    schoolName: z.string().min(2, "School name is required"),
    schoolEmail: z.string().email("A valid school email is required"),
    username: z.string().min(4).max(32),
    password: z.string().min(8, "Password must be at least 8 characters"),
  }),
});

export const verifySchoolSchema = z.object({
  body: z.object({
    schoolId: z.string().uuid(),
    code: z.string().length(6),
  }),
});

export const developerLoginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    passcode: z.string().min(4),
  }),
});

export const staffLoginSchema = z.object({
  body: z.object({
    schoolId: z.string().uuid(),
    username: z.string().min(1),
    password: z.string().min(1),
  }),
});

export const housemasterLoginSchema = z.object({
  body: z.object({
    schoolId: z.string().uuid(),
    fullName: z.string().min(2),
    sharedPassword: z.string().min(1),
  }),
});

export const studentLoginSchema = z.object({
  body: z.object({
    schoolId: z.string().uuid(),
    admissionNumber: z.string().min(1),
    pin: z.string().min(4).max(6),
  }),
});

export const registerStaffSchema = z.object({
  body: z.object({
    schoolId: z.string().uuid(),
    role: z.enum(["ACCOUNTANT", "SELLER"]),
    fullName: z.string().min(2),
    email: z.string().email(),
    phone: z.string().optional(),
    username: z.string().min(4).max(32),
    password: z.string().min(8),
  }),
});

