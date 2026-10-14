import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";
import { studentService } from "../student/student.service";
import { transactionService } from "../transaction/transaction.service";
import { batchService } from "../batch/batch.service";

export const sellerController = {
  searchStudents: asyncHandler(async (req, res) => {
    if (!req.auth?.schoolId) throw ApiError.forbidden();
    const search = req.query.search as string | undefined;
    const page = Number(req.query.page ?? 1);
    sendSuccess(res, await studentService.listForSchool(req.auth.schoolId, search, page));
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
    sendSuccess(res, await transactionService.getSellerBalanceSummary(req.auth.id));
  }),

  balanceHistory: asyncHandler(async (req, res) => {
    if (!req.auth) throw ApiError.forbidden();
    const days = Number(req.query.days ?? 30);
    sendSuccess(res, await transactionService.getSellerDailyBalanceHistory(req.auth.id, days));
  }),

  transactions: asyncHandler(async (req, res) => {
    if (!req.auth) throw ApiError.forbidden();
    const page = Number(req.query.page ?? 1);
    sendSuccess(res, await transactionService.listForSeller(req.auth.id, page));
  }),

  listBatchOrders: asyncHandler(async (req, res) => {
    if (!req.auth?.schoolId) throw ApiError.forbidden();
    const page = Number(req.query.page ?? 1);
    sendSuccess(res, await batchService.listForSchool(req.auth.schoolId, page));
  }),

  batchOrderDetail: asyncHandler(async (req, res) => {
    if (!req.auth?.schoolId) throw ApiError.forbidden();
    sendSuccess(res, await batchService.getBatchDetail(req.auth.schoolId, req.params.id));
  }),
};
