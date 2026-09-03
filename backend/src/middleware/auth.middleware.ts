import { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { verifyAccessToken } from "../utils/jwt.util";

/**
 * Requires a valid Bearer access token. Populates req.auth with
 * { id, role, schoolId } for use by downstream role middleware
 * and controllers.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return next(ApiError.unauthorized("Missing or malformed authorization header"));
  }

  const token = header.split(" ")[1];

  try {
    const payload = verifyAccessToken(token);
    req.auth = { id: payload.sub, role: payload.role, schoolId: payload.schoolId };
    return next();
  } catch {
    return next(ApiError.unauthorized("Invalid or expired access token"));
  }
}
