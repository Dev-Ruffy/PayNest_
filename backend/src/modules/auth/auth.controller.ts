import { Request, Response } from "express";
import { Role } from "@prisma/client";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import { authService } from "./auth.service";

const ipOf = (req: Request) => (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || undefined;

export const authController = {
  registerSchool: asyncHandler(async (req, res) => {
    const result = await authService.registerSchool(req.body);
    sendSuccess(res, result, "School registration submitted.", 201);
  }),

  verifySchool: asyncHandler(async (req, res) => {
    const result = await authService.verifySchool(req.body.schoolId, req.body.code);
    sendSuccess(res, result, "School verified.");
  }),

  developerLogin: asyncHandler(async (req, res) => {
    const { userId } = await authService.developerLogin(req.body.email, req.body.passcode, ipOf(req));
    const accessToken = await authService.issueSession(res, { id: userId, role: Role.DEVELOPER, schoolId: null, isStudent: false });
    sendSuccess(res, { accessToken, role: Role.DEVELOPER }, "Welcome back, developer.");
  }),

  staffLogin: asyncHandler(async (req, res) => {
    const user = await authService.staffLogin(req.body.schoolId, req.body.username, req.body.password, ipOf(req));
    const accessToken = await authService.issueSession(res, { id: user.id, role: user.role, schoolId: user.schoolId, isStudent: false });
    sendSuccess(res, {
      accessToken,
      role: user.role,
      user: { id: user.id, fullName: user.fullName, schoolId: user.schoolId },
    }, "Login successful.");
  }),

  housemasterLogin: asyncHandler(async (req, res) => {
    const housemaster = await authService.housemasterLogin(req.body.schoolId, req.body.fullName, req.body.sharedPassword, ipOf(req));
    const accessToken = await authService.issueSession(res, {
      id: housemaster.id,
      role: Role.HOUSEMASTER,
      schoolId: housemaster.schoolId,
      isStudent: false,
    });
    sendSuccess(res, {
      accessToken,
      role: Role.HOUSEMASTER,
      user: { id: housemaster.id, fullName: housemaster.fullName, schoolId: housemaster.schoolId },
    }, "Login successful.");
  }),

  studentLogin: asyncHandler(async (req, res) => {
    const student = await authService.studentLogin(req.body.schoolId, req.body.admissionNumber, req.body.pin, ipOf(req));
    const accessToken = await authService.issueSession(res, {
      id: student.id,
      role: Role.STUDENT,
      schoolId: student.schoolId,
      isStudent: true,
    });
    sendSuccess(res, {
      accessToken,
      role: Role.STUDENT,
      user: { id: student.id, fullName: student.fullName, schoolId: student.schoolId },
    }, "Login successful.");
  }),

  registerStaff: asyncHandler(async (req, res) => {
    const result = await authService.registerStaff(req.body);
    sendSuccess(res, result, "Registration submitted.", 201);
  }),

  refresh: asyncHandler(async (req, res) => {
    const accessToken = await authService.refresh(res, req.cookies?.[authService.REFRESH_COOKIE_NAME]);
    sendSuccess(res, { accessToken }, "Session refreshed.");
  }),

  logout: asyncHandler(async (req, res) => {
    await authService.logout(res, req.cookies?.[authService.REFRESH_COOKIE_NAME]);
    sendSuccess(res, null, "Logged out.");
  }),
};
