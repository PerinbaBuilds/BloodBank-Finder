import { NextFunction, Request, Response } from "express";
import { Role } from "@prisma/client";
import { verifyToken } from "@/utils/jwt";
import { AppError } from "@/utils/AppError";
import { prisma } from "@/config/prisma";

function extractToken(req: Request): string | undefined {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    return header.slice("Bearer ".length);
  }
  return req.cookies?.token;
}

/**
 * Roles aren't embedded as trusted JWT claims here: we re-read the current role from
 * the DB on every request. This keeps authorization in sync with whatever /auth/me
 * reports, instead of freezing a user's role at token-issue time.
 */
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) {
    return next(AppError.unauthorized("Authentication required"));
  }
  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    return next(AppError.unauthorized("Invalid or expired session"));
  }
  const user = await prisma.user.findUnique({ where: { id: payload.sub }, select: { id: true, role: true } });
  if (!user) {
    return next(AppError.unauthorized("Invalid or expired session"));
  }
  req.userId = user.id;
  req.userRole = user.role;
  next();
}

/** Populates req.userId/userRole when a valid token is present, but never rejects the request. */
export async function attachUserIfPresent(req: Request, _res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (token) {
    try {
      const payload = verifyToken(token);
      const user = await prisma.user.findUnique({ where: { id: payload.sub }, select: { id: true, role: true } });
      if (user) {
        req.userId = user.id;
        req.userRole = user.role;
      }
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
