import { Request } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";
import { adminService } from "./admin.service";
import { studentService } from "../student/student.service";
import { transactionService } from "../transaction/transaction.service";

const schoolIdOf = (req: Request) => {
  if (!req.auth?.schoolId) throw ApiError.forbidden();
  return req.auth.schoolId as string;
};

export const adminController = {
  overview: asyncHandler(async (req, res) => {
    const overview = await adminService.getOverview(schoolIdOf(req));
    sendSuccess(res, overview);
  }),

  listStudents: asyncHandler(async (req, res) => {
    const search = req.query.search as string | undefined;
    const page = Number(req.query.page ?? 1);
    const result = await studentService.listForSchool(schoolIdOf(req), search, page);
    sendSuccess(res, result);
  }),

  viewStudentPin: asyncHandler(async (req, res) => {
    const result = await studentService.viewPin(schoolIdOf(req), req.params.studentId, req.auth!.id);
    sendSuccess(res, result);
  }),

  listTransactions: asyncHandler(async (req, res) => {
    const page = Number(req.query.page ?? 1);
    const result = await transactionService.listForSchool(schoolIdOf(req), page);
    sendSuccess(res, result);
  }),

  listStaff: asyncHandler(async (req, res) => {
    const staff = await adminService.listStaff(schoolIdOf(req));
    sendSuccess(res, staff);
  }),

  listApprovals: asyncHandler(async (req, res) => {
    const approvals = await adminService.listPendingApprovals(schoolIdOf(req));
    sendSuccess(res, approvals);
  }),

  approve: asyncHandler(async (req, res) => {
    const result = await adminService.decideApproval(schoolIdOf(req), req.params.userId, true, req.body.reason, req.auth!.id);
    sendSuccess(res, result);
  }),

  reject: asyncHandler(async (req, res) => {
    const result = await adminService.decideApproval(schoolIdOf(req), req.params.userId, false, req.body.reason, req.auth!.id);
    sendSuccess(res, result);
  }),

  deleteStaff: asyncHandler(async (req, res) => {
    const result = await adminService.deleteStaff(schoolIdOf(req), req.params.userId, req.auth!.id);
    sendSuccess(res, result);
  }),

  changeHousemasterPassword: asyncHandler(async (req, res) => {
    const result = await adminService.changeHousemasterPassword(schoolIdOf(req), req.auth!.id, req.body.newPassword);
    sendSuccess(res, result);
  }),

  auditLogs: asyncHandler(async (req, res) => {
    const page = Number(req.query.page ?? 1);
    const result = await adminService.listAuditLogs(schoolIdOf(req), page);
    sendSuccess(res, result);
  }),

  settings: asyncHandler(async (req, res) => {
    const settings = await adminService.getSchoolSettings(schoolIdOf(req));
    sendSuccess(res, settings);
  }),
};
