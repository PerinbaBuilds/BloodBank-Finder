import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/AppError";
import { UpdateDonorInput } from "@/schemas/donor.schema";

export async function getDonorByUserId(userId: string) {
  const donor = await prisma.donorProfile.findUnique({ where: { userId }, include: { user: true } });
  if (!donor) throw AppError.notFound("Donor profile not found");
  return donor;
}

export async function updateDonor(userId: string, input: UpdateDonorInput) {
  const donor = await prisma.donorProfile.findUnique({ where: { userId } });
  if (!donor) throw AppError.notFound("Donor profile not found");

  if (input.phone) {
    await prisma.user.update({ where: { id: userId }, data: { phone: input.phone } });
  }

  const { phone, ...profileFields } = input;

  const updated = await prisma.donorProfile.update({
    where: { userId },
    data: profileFields,
    include: { user: true },
  });
  return updated;
}
