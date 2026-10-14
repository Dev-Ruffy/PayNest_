import { z } from "zod";

export const approvalDecisionSchema = z.object({
  body: z.object({
    reason: z.string().max(300).optional(),
  }),
  params: z.object({
    userId: z.string().uuid(),
  }),
});

export const changeHousemasterPasswordSchema = z.object({
  body: z.object({
    newPassword: z.string().min(8).optional(), // if omitted, a secure one is auto-generated
  }),
});

export const auditLogQuerySchema = z.object({
  query: z.object({
    page: z.string().optional(),
  }),
});

export const updateCreditLimitsSchema = z.object({
  body: z
    .object({
      creditPeriodType: z.enum(["TERM", "SESSION"]).nullable().optional(),
      creditPeriodMaxAmount: z.coerce.number().positive().nullable().optional(),
      dailySpendMaxAmount: z.coerce.number().positive().nullable().optional(),
    })
    .refine((data) => !!data.creditPeriodType === !!data.creditPeriodMaxAmount, {
      message: "Choose both a period type and a maximum amount, or clear both",
      path: ["creditPeriodMaxAmount"],
    }),
});
