import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/config/prisma";
import { env } from "@/config/env";
import { AppError } from "@/utils/AppError";
import { signToken } from "@/utils/jwt";
import { sendEmail } from "@/services/email.service";
import {
  ForgotPasswordInput,
  LoginInput,
  RegisterDonorInput,
  RegisterOrganizationInput,
  ResetPasswordInput,
} from "@/schemas/auth.schema";

const SALT_ROUNDS = 10;

function hashResetToken(rawToken: string) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

export async function registerDonor(input: RegisterDonorInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw AppError.conflict("An account with this email already exists");

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      phone: input.phone,
      role: "DONOR",
      donorProfile: {
        create: {
          fullName: input.fullName,
          bloodGroup: input.bloodGroup,
          gender: input.gender,
          dateOfBirth: input.dateOfBirth,
          weightKg: input.weightKg,
          heightCm: input.heightCm,
          lat: input.lat,
          lng: input.lng,
          address: input.address,
          city: input.city,
          state: input.state,
          pincode: input.pincode,
          isSmoker: input.isSmoker,
          isAlcoholic: input.isAlcoholic,
          usesDrugs: input.usesDrugs,
          hasChronicIllness: input.hasChronicIllness,
          chronicIllnessDetails: input.chronicIllnessDetails,
          hasGeneticDisorder: input.hasGeneticDisorder,
          geneticDisorderDetails: input.geneticDisorderDetails,
          lastDonationDate: input.lastDonationDate ?? null,
          totalDonations: input.lastDonationDate ? 1 : 0,
          hadTransfusion: input.hadTransfusion,
          transfusionDate: input.transfusionDate ?? null,
        },
      },
    },
    include: { donorProfile: true },
  });

  await sendEmail({
    to: user.email,
    subject: "Welcome to BloodBank Finder",
    text:
      `Hi ${input.fullName},\n\n` +
      `Thanks for registering as a blood donor with BloodBank Finder. You're now part of a network that helps ` +
      `hospitals and blood banks reach compatible donors quickly during emergencies.\n\n` +
      `Whenever a nearby request matches your blood group, we'll notify you. You can turn your availability ` +
      `on or off anytime from your dashboard.\n\n` +
      `Thank you for helping save lives.\n\n— The BloodBank Finder team`,
  });

  const token = signToken({ sub: user.id, role: user.role });
  return { user, token };
}

export async function registerOrganization(input: RegisterOrganizationInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw AppError.conflict("An account with this email already exists");

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      phone: input.phone,
      role: input.type === "BLOOD_BANK" ? "BLOOD_BANK" : "HOSPITAL",
      organization: {
        create: {
          name: input.name,
          type: input.type,
          regNumber: input.regNumber,
          contactPerson: input.contactPerson,
          lat: input.lat,
          lng: input.lng,
          address: input.address,
          city: input.city,
          state: input.state,
          pincode: input.pincode,
        },
      },
    },
    include: { organization: true },
  });

  await sendEmail({
    to: user.email,
    subject: "Welcome to BloodBank Finder",
    text:
      `Hi ${input.contactPerson},\n\n` +
      `Thanks for registering ${input.name} on BloodBank Finder.\n\n` +
      `Your organization account has been created and is pending verification by our team. Once verified, ` +
      `you'll be able to post emergency blood requests and appear in donor and organization searches.\n\n` +
      `— The BloodBank Finder team`,
  });

  const token = signToken({ sub: user.id, role: user.role });
  return { user, token };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    include: { donorProfile: true, organization: true },
  });
  if (!user || !user.isActive) throw AppError.unauthorized("Invalid email or password");

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) throw AppError.unauthorized("Invalid email or password");

  const token = signToken({ sub: user.id, role: user.role });
  return { user, token };
}

/**
 * Starts a password reset. Always resolves without revealing whether the email
 * exists (prevents account enumeration). When the account exists, a single-use
 * token is stored (hashed) and a reset link is emailed.
 */
export async function requestPasswordReset(input: ForgotPasswordInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user || !user.isActive) return;

  const rawToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + env.PASSWORD_RESET_TOKEN_TTL_MINUTES * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: { resetTokenHash: hashResetToken(rawToken), resetTokenExpiresAt: expiresAt },
  });

  const resetUrl = `${env.APP_URL.replace(/\/$/, "")}/reset-password?token=${rawToken}`;
  await sendEmail({
    to: user.email,
    subject: "Reset your BloodBank Finder password",
    text:
      `We received a request to reset the password for your BloodBank Finder account.\n\n` +
      `Reset your password using the link below (valid for ${env.PASSWORD_RESET_TOKEN_TTL_MINUTES} minutes):\n` +
      `${resetUrl}\n\n` +
      `If you didn't request this, you can safely ignore this email — your password won't change.`,
  });
}

/** Completes a password reset using a valid, unexpired token. */
export async function resetPassword(input: ResetPasswordInput) {
  const user = await prisma.user.findFirst({
    where: {
      resetTokenHash: hashResetToken(input.token),
      resetTokenExpiresAt: { gt: new Date() },
    },
  });
  if (!user) throw AppError.badRequest("This reset link is invalid or has expired. Please request a new one.");

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, resetTokenHash: null, resetTokenExpiresAt: null },
  });
}
