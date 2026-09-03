import { z } from "zod";

export const creditStudentSchema = z.object({
  body: z.object({
    studentId: z.string().uuid(),
    amount: z.coerce.number().positive("Amount must be greater than zero"),
    description: z.string().max(200).optional(),
  }),
});

export const createStudentSchema = z.object({
  body: z.object({
    fullName: z.string().min(2),
    admissionNumber: z.string().min(1),
    className: z.string().min(1),
    parentName: z.string().min(2),
    parentPhone: z.string().min(5),
    parentEmail: z.string().email(),
  }),
});
