import { z } from "zod";

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Enter a product name").max(120),
    price: z.coerce.number().positive("Price must be greater than zero"),
  }),
});

export const updateProductSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(120).optional(),
    price: z.coerce.number().positive().optional(),
    isActive: z.boolean().optional(),
  }),
  params: z.object({ id: z.string().uuid() }),
});
