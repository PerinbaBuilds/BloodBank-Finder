import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/AppError";
import { UpdateDonorInput } from "@/schemas/donor.schema";
import { BLOOD_GROUP_LABELS } from "@/utils/blood";

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

export async function getDonationHistory(userId: string) {
  const donations = await prisma.requestResponse.findMany({
    where: { donorUserId: userId, status: "COMPLETED" },
    include: { request: { include: { organization: true } } },
    orderBy: { updatedAt: "desc" },
  });

  return donations.map((donation) => ({
    id: donation.id,
    requestId: donation.requestId,
    bloodGroup: BLOOD_GROUP_LABELS[donation.request.bloodGroup],
    unitsNeeded: donation.request.unitsNeeded,
    distanceKm: donation.distanceKm,
    donatedAt: donation.updatedAt,
    organization: {
      id: donation.request.organization.id,
      name: donation.request.organization.name,
      type: donation.request.organization.type,
      city: donation.request.organization.city,
    },
  }));
}
