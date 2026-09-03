import { NextFunction, Request, Response } from "express";
import { Role } from "@prisma/client";
import { ApiError } from "../utils/ApiError";

/** Restricts a route to one or more roles. Must run after requireAuth. */
export const requireRole = (...roles: Role[]) => (req: Request, _res: Response, next: NextFunction) => {
  if (!req.auth) return next(ApiError.unauthorized());
  if (!roles.includes(req.auth.role)) {
    return next(ApiError.forbidden(`This action requires one of the following roles: ${roles.join(", ")}`));
  }
  return next();
};
