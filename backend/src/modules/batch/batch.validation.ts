import { z } from "zod";

export const createBatchSchema = z.object({
  body: z.object({ label: z.string().max(150).optional() }),
});

export const addStudentsSchema = z.object({
  body: z.object({ studentIds: z.array(z.string().uuid()).min(1, "Select at least one student") }),
});

const orderItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.coerce.number().int().positive(),
});

export const setStudentOrderSchema = z.object({
  body: z
    .object({
      items: z.array(orderItemSchema).optional(),
      isCustom: z.boolean().optional(),
      customAmount: z.coerce.number().positive().optional(),
      customReason: z.string().min(3).max(300).optional(),
    })
    .refine((data) => (data.isCustom ? !!data.customAmount && !!data.customReason : (data.items?.length ?? 0) > 0), {
      message: "Provide either a product list, or a custom amount with a reason",
    }),
});

export const applyProductSchema = z.object({
  body: z.object({
    studentIds: z.array(z.string().uuid()).min(1, "Select at least one student"),
    productId: z.string().uuid(),
    quantity: z.coerce.number().int().positive(),
  }),
});
