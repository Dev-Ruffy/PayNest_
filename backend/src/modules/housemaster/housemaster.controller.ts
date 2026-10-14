import { Role } from "@prisma/client";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";
import { studentService } from "../student/student.service";
import { authService } from "../auth/auth.service";
import { transactionService } from "../transaction/transaction.service";
import { productService } from "../product/product.service";

export const housemasterController = {
  createStudent: asyncHandler(async (req, res) => {
    if (!req.auth?.schoolId) throw ApiError.forbidden();
    const student = await authService.registerStudent({ ...req.body, schoolId: req.auth.schoolId, createdById: req.auth.id });
    sendSuccess(res, student, "Student created.", 201);
  }),

  listStudents: asyncHandler(async (req, res) => {
    if (!req.auth?.schoolId) throw ApiError.forbidden();
    const search = req.query.search as string | undefined;
    const page = Number(req.query.page ?? 1);
    const pageSize = Math.min(Number(req.query.pageSize ?? 20), 200);
    const className = req.query.className as string | undefined;
    const house = req.query.house as string | undefined;
    sendSuccess(res, await studentService.listForSchool(req.auth.schoolId, search, page, pageSize, { className, house }));
  }),

  studentGroupings: asyncHandler(async (req, res) => {
    if (!req.auth?.schoolId) throw ApiError.forbidden();
    sendSuccess(res, await studentService.listGroupings(req.auth.schoolId));
  }),

  creditStudent: asyncHandler(async (req, res) => {
    if (!req.auth?.schoolId) throw ApiError.forbidden();
    const result = await transactionService.creditStudent({
      schoolId: req.auth.schoolId,
      studentId: req.body.studentId,
      amount: req.body.amount,
      description: req.body.description,
      createdById: req.auth.id,
      createdByRole: Role.HOUSEMASTER,
    });
    sendSuccess(res, result, "Student wallet credited.");
  }),

  transactions: asyncHandler(async (req, res) => {
    if (!req.auth) throw ApiError.forbidden();
    const page = Number(req.query.page ?? 1);
    sendSuccess(res, await transactionService.listCreatedBy(req.auth.id, page));
  }),

  // NOTE: PIN viewing was intentionally removed from Housemaster — Admin-only now.

  listProducts: asyncHandler(async (req, res) => {
    if (!req.auth?.schoolId) throw ApiError.forbidden();
    sendSuccess(res, await productService.listActiveForSchool(req.auth.schoolId));
  }),
};
