import { BloodGroup, DonorProfile } from "@prisma/client";
import { prisma } from "@/config/prisma";
import { compatibleDonorGroupsFor } from "@/utils/blood";
import { haversineDistanceKm, roundKm } from "@/utils/distance";
import { checkDonationEligibility } from "@/utils/eligibility";
import { env } from "@/config/env";

export interface DonorMatch {
  donor: DonorProfile;
  distanceKm: number;
}

/** Finds available, eligible, blood-type-compatible donors within radiusKm of a point. */
export async function findCompatibleDonors(params: {
  bloodGroup: BloodGroup;
  lat: number;
  lng: number;
  radiusKm?: number;
}): Promise<DonorMatch[]> {
  const radiusKm = params.radiusKm ?? env.DEFAULT_MATCH_RADIUS_KM;
  const compatibleGroups = compatibleDonorGroupsFor(params.bloodGroup);

  const candidates = await prisma.donorProfile.findMany({
    where: {
      bloodGroup: { in: compatibleGroups },
      isAvailable: true,
    },
  });

  return candidates
    .filter((donor) => checkDonationEligibility(donor.lastDonationDate).isEligible)
    .map((donor) => ({
      donor,
      distanceKm: roundKm(haversineDistanceKm(params.lat, params.lng, donor.lat, donor.lng)),
    }))
    .filter((match) => match.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

/** Finds verified blood banks within radiusKm, optionally filtered to those stocking a given blood group. */
export async function findNearbyBloodBanks(params: {
  bloodGroup?: BloodGroup;
  lat: number;
  lng: number;
  radiusKm?: number;
}) {
  const radiusKm = params.radiusKm ?? env.DEFAULT_MATCH_RADIUS_KM;

  const orgs = await prisma.organization.findMany({
    where: {
      type: "BLOOD_BANK",
      isVerified: true,
      ...(params.bloodGroup
        ? { inventory: { some: { bloodGroup: params.bloodGroup, units: { gt: 0 } } } }
        : {}),
    },
    include: { inventory: true },
  });

  return orgs
    .map((organization) => ({
      organization,
      distanceKm: roundKm(haversineDistanceKm(params.lat, params.lng, organization.lat, organization.lng)),
    }))
    .filter((match) => match.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}
