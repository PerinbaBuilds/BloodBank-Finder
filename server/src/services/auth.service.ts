import bcrypt from "bcryptjs";
import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/AppError";
import { signToken } from "@/utils/jwt";
import { LoginInput, RegisterDonorInput, RegisterOrganizationInput } from "@/schemas/auth.schema";

const SALT_ROUNDS = 10;

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
          lat: input.lat,
          lng: input.lng,
          address: input.address,
          city: input.city,
          state: input.state,
          pincode: input.pincode,
        },
      },
    },
    include: { donorProfile: true },
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
