import { NextFunction, Request, Response } from "express";
import { Role } from "@prisma/client";
import { verifyToken } from "@/utils/jwt";
import { AppError } from "@/utils/AppError";

function extractToken(req: Request): string | undefined {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    return header.slice("Bearer ".length);
  }
  return req.cookies?.token;
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) {
    return next(AppError.unauthorized("Authentication required"));
  }
  try {
    const payload = verifyToken(token);
    req.userId = payload.sub;
    req.userRole = payload.role;
    next();
  } catch {
    return next(AppError.unauthorized("Invalid or expired session"));
  }
}

/** Populates req.userId/userRole when a valid token is present, but never rejects the request. */
export function attachUserIfPresent(req: Request, _res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (token) {
    try {
      const payload = verifyToken(token);
      req.userId = payload.sub;
      req.userRole = payload.role;
    } catch {
      // ignore invalid token on optional-auth routes
    }
  }
  next();
}

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      return next(AppError.forbidden("You do not have permission to perform this action"));
    }
    next();
  };
}
