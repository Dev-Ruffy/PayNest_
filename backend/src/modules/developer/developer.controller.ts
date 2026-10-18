import { AuditAction } from "@prisma/client";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import { developerService } from "./developer.service";

export const developerController = {
  overview: asyncHandler(async (_req, res) => {
    sendSuccess(res, await developerService.getOverview());
  }),

  listSchools: asyncHandler(async (_req, res) => {
    sendSuccess(res, await developerService.listSchools());
  }),

  getSchool: asyncHandler(async (req, res) => {
    sendSuccess(res, await developerService.getSchool(req.params.id));
  }),

  createSchool: asyncHandler(async (req, res) => {
    const result = await developerService.createSchool(req.body);
    sendSuccess(res, result, "School created.", 201);
  }),

  deleteSchool: asyncHandler(async (req, res) => {
    sendSuccess(res, await developerService.deleteSchool(req.params.id, req.auth!.id));
  }),

  listDeletedSchools: asyncHandler(async (_req, res) => {
    sendSuccess(res, await developerService.listDeletedSchools());
  }),

  restoreSchool: asyncHandler(async (req, res) => {
    sendSuccess(res, await developerService.restoreSchool(req.params.id, req.auth!.id));
  }),

  permanentlyDeleteSchool: asyncHandler(async (req, res) => {
    sendSuccess(res, await developerService.permanentlyDeleteSchool(req.params.id, req.auth!.id));
  }),

  listVerificationRequests: asyncHandler(async (_req, res) => {
    sendSuccess(res, await developerService.listVerificationRequests());
  }),

  approveSchool: asyncHandler(async (req, res) => {
    const result = await developerService.approveSchool(req.params.id, req.auth!.id);
    sendSuccess(res, result);
  }),

  rejectSchool: asyncHandler(async (req, res) => {
    const result = await developerService.rejectSchool(req.params.id, req.auth!.id, req.body.reason);
    sendSuccess(res, result);
  }),

  listAllTransactions: asyncHandler(async (req, res) => {
    const page = Number(req.query.page ?? 1);
    sendSuccess(res, await developerService.listAllTransactions(page));
  }),

  listActiveUsers: asyncHandler(async (_req, res) => {
    sendSuccess(res, await developerService.listActiveUsers());
  }),

  listFailedLogins: asyncHandler(async (req, res) => {
    const page = Number(req.query.page ?? 1);
    sendSuccess(res, await developerService.listFailedLogins(page));
  }),

  listAuditLogs: asyncHandler(async (req, res) => {
    const page = Number(req.query.page ?? 1);
    const schoolId = (req.query.schoolId as string) || undefined;
    const actionParam = req.query.action as string | undefined;
    // Only pass through action values that are real AuditAction enum members -
    // anything else is silently ignored rather than crashing the Prisma query.
    const action =
      actionParam && (Object.values(AuditAction) as string[]).includes(actionParam)
        ? (actionParam as AuditAction)
        : undefined;
    sendSuccess(res, await developerService.listAuditLogs(page, 30, { schoolId, action }));
  }),

  getSettings: asyncHandler(async (_req, res) => {
    sendSuccess(res, await developerService.getSettings());
  }),

  updateSetting: asyncHandler(async (req, res) => {
    sendSuccess(res, await developerService.updateSetting(req.params.key, req.body.value));
  }),

  databaseOverview: asyncHandler(async (_req, res) => {
    sendSuccess(res, await developerService.getDatabaseOverview());
  }),

  storageOverview: asyncHandler(async (_req, res) => {
    sendSuccess(res, developerService.getStorageOverview());
  }),

  apiHealth: asyncHandler(async (_req, res) => {
    sendSuccess(res, await developerService.getApiHealth());
  }),
};
