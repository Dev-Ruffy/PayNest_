import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";
import { studentService } from "../student/student.service";
import { transactionService } from "../transaction/transaction.service";
import { prisma } from "../../config/db";

export const sellerController = {
  searchStudents: asyncHandler(async (req, res) => {
    if (!req.auth?.schoolId) throw ApiError.forbidden();
    const search = req.query.search as string | undefined;
    const page = Number(req.query.page ?? 1);
    const result = await studentService.listForSchool(req.auth.schoolId, search, page);
    sendSuccess(res, result);
  }),

  purchase: asyncHandler(async (req, res) => {
    if (!req.auth?.schoolId) throw ApiError.forbidden();
    const result = await transactionService.purchase({
      schoolId: req.auth.schoolId,
      studentId: req.body.studentId,
      sellerId: req.auth.id,
      amount: req.body.amount,
      items: req.body.items,
      pin: req.body.pin,
    });
    sendSuccess(res, result, "Purchase completed.");
  }),

  wallet: asyncHandler(async (req, res) => {
    if (!req.auth) throw ApiError.forbidden();
    const seller = await prisma.user.findUnique({
      where: { id: req.auth.id },
      select: { id: true, fullName: true, walletBalance: true },
    });
    sendSuccess(res, seller);
  }),

  transactions: asyncHandler(async (req, res) => {
    if (!req.auth) throw ApiError.forbidden();
    const page = Number(req.query.page ?? 1);
    const result = await transactionService.listForSeller(req.auth.id, page);
    sendSuccess(res, result);
  }),
};
