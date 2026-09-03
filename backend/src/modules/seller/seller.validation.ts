import { z } from "zod";

export const purchaseSchema = z.object({
  body: z.object({
    studentId: z.string().uuid(),
    items: z.array(z.string().min(1)).min(1, "At least one item is required"),
    amount: z.coerce.number().positive("Amount must be greater than zero"),
    pin: z.string().min(4).max(6),
  }),
});
