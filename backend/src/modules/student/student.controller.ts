import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import { studentService } from "./student.service";
import { transactionService } from "../transaction/transaction.service";
import { ApiError } from "../../utils/ApiError";

export const studentController = {
  me: asyncHandler(async (req, res) => {
    if (!req.auth) throw ApiError.unauthorized();
    const profile = await studentService.getProfile(req.auth.id);
    sendSuccess(res, profile);
  }),

  transactions: asyncHandler(async (req, res) => {
    if (!req.auth) throw ApiError.unauthorized();
    const page = Number(req.query.page ?? 1);
    const result = await transactionService.listForStudent(req.auth.id, page);
    sendSuccess(res, result);
  }),
};
