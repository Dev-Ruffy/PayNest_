import { Request } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";
import { batchService } from "./batch.service";

const schoolIdOf = (req: Request) => {
  if (!req.auth?.schoolId) throw ApiError.forbidden();
  return req.auth.schoolId as string;
};

export const batchController = {
  create: asyncHandler(async (req, res) => {
    const batch = await batchService.createBatch({ schoolId: schoolIdOf(req), createdById: req.auth!.id, label: req.body.label });
    sendSuccess(res, batch, "Batch created.", 201);
  }),

  list: asyncHandler(async (req, res) => {
    const page = Number(req.query.page ?? 1);
    sendSuccess(res, await batchService.listForHousemaster(schoolIdOf(req), req.auth!.id, page));
  }),

  detail: asyncHandler(async (req, res) => {
    sendSuccess(res, await batchService.getBatchDetail(schoolIdOf(req), req.params.id));
  }),

  addStudents: asyncHandler(async (req, res) => {
    const result = await batchService.addStudents({ schoolId: schoolIdOf(req), batchId: req.params.id, studentIds: req.body.studentIds });
    sendSuccess(res, result, "Students added.");
  }),

  removeStudent: asyncHandler(async (req, res) => {
    sendSuccess(res, await batchService.removeStudent({ schoolId: schoolIdOf(req), batchId: req.params.id, studentId: req.params.studentId }));
  }),

  setStudentOrder: asyncHandler(async (req, res) => {
    const order = await batchService.setStudentOrder({
      schoolId: schoolIdOf(req),
      batchId: req.params.id,
      studentId: req.params.studentId,
      items: req.body.items,
      isCustom: req.body.isCustom,
      customAmount: req.body.customAmount,
      customReason: req.body.customReason,
    });
    sendSuccess(res, order, "Order updated.");
  }),

  applyProduct: asyncHandler(async (req, res) => {
    const result = await batchService.applyProductToStudents({
      schoolId: schoolIdOf(req),
      batchId: req.params.id,
      studentIds: req.body.studentIds,
      productId: req.body.productId,
      quantity: req.body.quantity,
    });
    sendSuccess(res, result, "Product applied.");
  }),

  review: asyncHandler(async (req, res) => {
    sendSuccess(res, await batchService.getReview(schoolIdOf(req), req.params.id));
  }),

  confirm: asyncHandler(async (req, res) => {
    const result = await batchService.confirmBatch({ schoolId: schoolIdOf(req), batchId: req.params.id, actorId: req.auth!.id });
    sendSuccess(res, result, "Batch processed.");
  }),

  duplicate: asyncHandler(async (req, res) => {
    const batch = await batchService.duplicateBatch({ schoolId: schoolIdOf(req), batchId: req.params.id, createdById: req.auth!.id });
    sendSuccess(res, batch, "Batch duplicated.", 201);
  }),

  cancel: asyncHandler(async (req, res) => {
    sendSuccess(res, await batchService.cancelBatch({ schoolId: schoolIdOf(req), batchId: req.params.id, actorId: req.auth!.id }));
  }),
};
