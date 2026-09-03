import { z } from "zod";

export const registerSchoolSchema = z.object({
  registrantName: z.string().min(2, "Enter your full name"),
  registrantDesignation: z.enum(["Principal", "Head of School", "Admin"]),
  schoolName: z.string().min(2, "Enter your school's name"),
  schoolEmail: z.string().email("Enter a valid school email"),
  username: z.string().min(4, "At least 4 characters"),
  password: z.string().min(8, "At least 8 characters"),
});
export type RegisterSchoolInput = z.infer<typeof registerSchoolSchema>;

export const verifyCodeSchema = z.object({
  code: z.string().length(6, "Enter the 6-digit code"),
});
export type VerifyCodeInput = z.infer<typeof verifyCodeSchema>;

export const developerLoginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  passcode: z.string().min(4, "Enter your passcode"),
});
export type DeveloperLoginInput = z.infer<typeof developerLoginSchema>;

export const staffLoginSchema = z.object({
  username: z.string().min(1, "Enter your username"),
  password: z.string().min(1, "Enter your password"),
});
export type StaffLoginInput = z.infer<typeof staffLoginSchema>;

export const housemasterLoginSchema = z.object({
  fullName: z.string().min(2, "Enter your full name"),
  sharedPassword: z.string().min(1, "Enter the shared password"),
});
export type HousemasterLoginInput = z.infer<typeof housemasterLoginSchema>;

export const studentLoginSchema = z.object({
  admissionNumber: z.string().min(1, "Enter your admission number"),
  pin: z.string().min(4, "4-6 digits").max(6, "4-6 digits"),
});
export type StudentLoginInput = z.infer<typeof studentLoginSchema>;

export const registerStaffSchema = z.object({
  fullName: z.string().min(2, "Enter your full name"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().optional(),
  username: z.string().min(4, "At least 4 characters"),
  password: z.string().min(8, "At least 8 characters"),
});
export type RegisterStaffInput = z.infer<typeof registerStaffSchema>;

export const registerStudentSchema = z.object({
  fullName: z.string().min(2, "Enter the student's full name"),
  admissionNumber: z.string().min(1, "Enter an admission number"),
  className: z.string().min(1, "Enter a class"),
  parentName: z.string().min(2, "Enter a parent/guardian name"),
  parentPhone: z.string().min(5, "Enter a valid phone number"),
  parentEmail: z.string().email("Enter a valid email"),
});
export type RegisterStudentInput = z.infer<typeof registerStudentSchema>;

export const creditStudentSchema = z.object({
  amount: z.coerce.number().positive("Enter an amount greater than zero"),
  description: z.string().max(200).optional(),
});
export type CreditStudentInput = z.infer<typeof creditStudentSchema>;

export const changeHousemasterPasswordSchema = z.object({
  newPassword: z.string().min(8, "At least 8 characters"),
});
export type ChangeHousemasterPasswordInput = z.infer<typeof changeHousemasterPasswordSchema>;

export const purchaseSchema = z.object({
  items: z.string().min(1, "List at least one item"),
  amount: z.coerce.number().positive("Enter an amount greater than zero"),
  pin: z.string().min(4, "4-6 digits").max(6, "4-6 digits"),
});
export type PurchaseInput = z.infer<typeof purchaseSchema>;

/** Used for a student's very first purchase, where the PIN they enter here becomes their permanent PIN. */
export const firstPurchaseSchema = z
  .object({
    items: z.string().min(1, "List at least one item"),
    amount: z.coerce.number().positive("Enter an amount greater than zero"),
    pin: z.string().min(4, "4-6 digits").max(6, "4-6 digits"),
    confirmPin: z.string().min(1, "Re-enter the PIN to confirm"),
  })
  .refine((data) => data.pin === data.confirmPin, {
    message: "PINs don't match",
    path: ["confirmPin"],
  });
export type FirstPurchaseInput = z.infer<typeof firstPurchaseSchema>;
