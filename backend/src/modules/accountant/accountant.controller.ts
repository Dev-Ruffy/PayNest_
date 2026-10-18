import { Role } from "@prisma/client";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";
import { studentService } from "../student/student.service";
import { authService } from "../auth/auth.service";
import { transactionService } from "../transaction/transaction.service";
import { prisma } from "../../config/db";

export const accountantController = {
  createStudent: asyncHandler(async (req, res) => {
    if (!req.auth?.schoolId) throw ApiError.forbidden();
    const student = await authService.registerStudent({
      ...req.body,
      schoolId: req.auth.schoolId,
      createdById: req.auth.id,
    });
    sendSuccess(res, student, "Student created.", 201);
  }),

  listStudents: asyncHandler(async (req, res) => {
    if (!req.auth?.schoolId) throw ApiError.forbidden();
    const search = req.query.search as string | undefined;
    const page = Number(req.query.page ?? 1);
    const result = await studentService.listForSchool(req.auth.schoolId, search, page);
    sendSuccess(res, result);
  }),

  creditStudent: asyncHandler(async (req, res) => {
    if (!req.auth?.schoolId) throw ApiError.forbidden();
    const result = await transactionService.creditStudent({
      schoolId: req.auth.schoolId,
      studentId: req.body.studentId,
      amount: req.body.amount,
      description: req.body.description,
      createdById: req.auth.id,
      createdByRole: Role.ACCOUNTANT,
    });
    sendSuccess(res, result, "Student wallet credited.");
  }),

  creditHistory: asyncHandler(async (req, res) => {
    if (!req.auth) throw ApiError.forbidden();
    const page = Number(req.query.page ?? 1);
    const result = await transactionService.listCreatedBy(req.auth.id, page);
    sendSuccess(res, result);
  }),

  /** School-wide transaction visibility - includes Seller purchases, Housemaster credits, everything. */
  allTransactions: asyncHandler(async (req, res) => {
    if (!req.auth?.schoolId) throw ApiError.forbidden();
    const page = Number(req.query.page ?? 1);
    const result = await transactionService.listForSchool(req.auth.schoolId, page);
    sendSuccess(res, result);
  }),

  /** The school's Seller daily balance history - one Seller per school, so no ID is needed. */
  sellerBalanceHistory: asyncHandler(async (req, res) => {
    if (!req.auth?.schoolId) throw ApiError.forbidden();
    const seller = await prisma.user.findFirst({ where: { schoolId: req.auth.schoolId, role: Role.SELLER } });
    if (!seller) throw ApiError.notFound("This school doesn't have a Tuck Shop Seller yet.");
    const days = Number(req.query.days ?? 30);
    const history = await transactionService.getSellerDailyBalanceHistory(seller.id, days);
    sendSuccess(res, { sellerName: seller.fullName, history });
  }),
};
