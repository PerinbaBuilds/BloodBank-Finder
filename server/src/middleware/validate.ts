import { NextFunction, Request, Response } from "express";
import { ZodType } from "zod";
import { AppError } from "@/utils/AppError";

type ValidationTarget = "body" | "query" | "params";

/**
 * Express 5 makes `req.query` a read-only getter (assigning to it silently no-ops),
 * so validated/coerced data is stashed on `req.validated` instead of written back
 * onto `req.body`/`req.query`/`req.params`.
 */
export function validate(schema: ZodType, target: ValidationTarget = "body") {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      return next(AppError.badRequest("Validation failed", result.error.flatten()));
    }
    req.validated = { ...req.validated, [target]: result.data };
    next();
  };
}

export function validated<T>(req: Request, target: ValidationTarget = "body"): T {
  return req.validated?.[target] as T;
}
