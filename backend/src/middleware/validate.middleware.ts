import { NextFunction, Request, Response } from "express";
import { AnyZodObject, ZodError } from "zod";
import { ApiError } from "../utils/ApiError";

/**
 * Validates req.body/query/params against a Zod schema shaped as
 * { body?, query?, params? }. Replaces req.body etc. with the parsed
 * (and coerced/defaulted) values on success.
 */
export const validate = (schema: AnyZodObject) => (req: Request, _res: Response, next: NextFunction) => {
  try {
    const parsed = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    if (parsed.body) req.body = parsed.body;
    if (parsed.params) req.params = parsed.params;
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      return next(ApiError.badRequest("Validation failed", err.flatten().fieldErrors));
    }
    next(err);
  }
};
