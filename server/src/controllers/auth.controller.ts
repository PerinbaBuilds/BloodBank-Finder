import { Request, Response } from "express";
import { User } from "@prisma/client";
import * as authService from "@/services/auth.service";
import { validated } from "@/middleware/validate";
import {
  ForgotPasswordInput,
  LoginInput,
  RegisterDonorInput,
  RegisterOrganizationInput,
  ResetPasswordInput,
} from "@/schemas/auth.schema";
import { setAuthCookie, clearAuthCookie } from "@/utils/cookies";
import { serializeDonor, serializeOrganization } from "@/services/serializers";
import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/AppError";

function publicUser(user: User) {
  return { id: user.id, email: user.email, role: user.role, phone: user.phone };
}

export async function registerDonor(req: Request, res: Response) {
  const input = validated<RegisterDonorInput>(req);
  const { user, token } = await authService.registerDonor(input);
  setAuthCookie(res, token);
  res.status(201).json({
    token,
    user: publicUser(user),
    donor: user.donorProfile ? serializeDonor({ ...user.donorProfile, user }) : undefined,
  });
}

export async function registerOrganization(req: Request, res: Response) {
  const input = validated<RegisterOrganizationInput>(req);
  const { user, token } = await authService.registerOrganization(input);
  setAuthCookie(res, token);
  res.status(201).json({
    token,
    user: publicUser(user),
    organization: user.organization ? serializeOrganization({ ...user.organization, user }) : undefined,
  });
}

export async function login(req: Request, res: Response) {
  const input = validated<LoginInput>(req);
  const { user, token } = await authService.login(input);
  setAuthCookie(res, token);
  res.json({
    token,
    user: publicUser(user),
    donor: user.donorProfile ? serializeDonor({ ...user.donorProfile, user }) : undefined,
    organization: user.organization ? serializeOrganization({ ...user.organization, user }) : undefined,
  });
}

export async function forgotPassword(req: Request, res: Response) {
  const input = validated<ForgotPasswordInput>(req);
  await authService.requestPasswordReset(input);
  // Always the same response so an attacker can't tell which emails are registered.
  res.json({ message: "If an account exists for that email, a password reset link has been sent." });
}

export async function resetPassword(req: Request, res: Response) {
  const input = validated<ResetPasswordInput>(req);
  await authService.resetPassword(input);
  res.json({ message: "Your password has been reset. You can now log in with your new password." });
}

export async function logout(_req: Request, res: Response) {
  clearAuthCookie(res);
  res.status(204).send();
}

export async function me(req: Request, res: Response) {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    include: { donorProfile: true, organization: true },
  });
  if (!user) throw AppError.unauthorized();
  res.json({
    user: publicUser(user),
    donor: user.donorProfile ? serializeDonor({ ...user.donorProfile, user }) : undefined,
    organization: user.organization ? serializeOrganization({ ...user.organization, user }) : undefined,
  });
}
