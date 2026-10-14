import { Request } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";
import { productService } from "./product.service";

const schoolIdOf = (req: Request) => {
  if (!req.auth?.schoolId) throw ApiError.forbidden();
  return req.auth.schoolId as string;
};

export const productController = {
  listAll: asyncHandler(async (req, res) => {
    sendSuccess(res, await productService.listAllForSchool(schoolIdOf(req)));
  }),

  listActive: asyncHandler(async (req, res) => {
    sendSuccess(res, await productService.listActiveForSchool(schoolIdOf(req)));
  }),

  create: asyncHandler(async (req, res) => {
    const product = await productService.create({
      schoolId: schoolIdOf(req),
      name: req.body.name,
      price: req.body.price,
      createdById: req.auth!.id,
    });
    sendSuccess(res, product, "Product added.", 201);
  }),

  update: asyncHandler(async (req, res) => {
    const product = await productService.update({
      schoolId: schoolIdOf(req),
      productId: req.params.id,
      actorId: req.auth!.id,
      name: req.body.name,
      price: req.body.price,
      isActive: req.body.isActive,
    });
    sendSuccess(res, product, "Product updated.");
  }),
};
