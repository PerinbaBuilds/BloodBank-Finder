import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/AppError";
import { UpdateOrganizationInput, SearchOrganizationsInput } from "@/schemas/organization.schema";
import { haversineDistanceKm, roundKm } from "@/utils/distance";

export async function getOrganizationByUserId(userId: string) {
  const org = await prisma.organization.findUnique({ where: { userId }, include: { user: true } });
  if (!org) throw AppError.notFound("Organization profile not found");
  return org;
}

export async function getOrganizationById(id: string) {
  const org = await prisma.organization.findUnique({ where: { id }, include: { inventory: true } });
  if (!org) throw AppError.notFound("Organization not found");
  return org;
}

export async function updateOrganization(userId: string, input: UpdateOrganizationInput) {
  const org = await prisma.organization.findUnique({ where: { userId } });
  if (!org) throw AppError.notFound("Organization profile not found");

  const { phone, ...profileFields } = input;
  if (phone) {
    await prisma.user.update({ where: { id: userId }, data: { phone } });
  }

  return prisma.organization.update({ where: { userId }, data: profileFields, include: { user: true } });
}

export async function searchOrganizations(filters: SearchOrganizationsInput) {
  const orgs = await prisma.organization.findMany({
    where: {
      isVerified: true,
      ...(filters.type ? { type: filters.type } : {}),
      ...(filters.city ? { city: { equals: filters.city, mode: "insensitive" } } : {}),
      ...(filters.bloodGroup
        ? { inventory: { some: { bloodGroup: filters.bloodGroup, units: { gt: 0 } } } }
        : {}),
    },
    include: { inventory: true },
  });

  let withDistance = orgs.map((organization) => ({
    organization,
    distanceKm:
      filters.lat !== undefined && filters.lng !== undefined
        ? roundKm(haversineDistanceKm(filters.lat, filters.lng, organization.lat, organization.lng))
        : undefined,
  }));

  if (filters.lat !== undefined && filters.lng !== undefined) {
    withDistance = withDistance
      .filter((entry) => (entry.distanceKm ?? 0) <= filters.radiusKm)
      .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
  } else {
    withDistance.sort((a, b) => a.organization.name.localeCompare(b.organization.name));
  }

  return withDistance;
}
