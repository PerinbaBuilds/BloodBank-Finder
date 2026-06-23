import { Request, Response } from "express";
import * as donorsService from "@/services/donors.service";
import { findCompatibleDonors } from "@/services/matching.service";
import { validated } from "@/middleware/validate";
import { SearchDonorsInput, UpdateDonorInput } from "@/schemas/donor.schema";
import { serializeDonor, serializeDonorPublic } from "@/services/serializers";

export async function getMe(req: Request, res: Response) {
  const donor = await donorsService.getDonorByUserId(req.userId!);
  res.json(serializeDonor(donor));
}

export async function updateMe(req: Request, res: Response) {
  const input = validated<UpdateDonorInput>(req);
  const donor = await donorsService.updateDonor(req.userId!, input);
  res.json(serializeDonor(donor));
}

export async function getMyDonations(req: Request, res: Response) {
  const donations = await donorsService.getDonationHistory(req.userId!);
  res.json(donations);
}

export async function search(req: Request, res: Response) {
  const filters = validated<SearchDonorsInput>(req, "query");
  if (!filters.bloodGroup) {
    return res.json([]);
  }
  const matches = await findCompatibleDonors({
    bloodGroup: filters.bloodGroup,
    lat: filters.lat,
    lng: filters.lng,
    radiusKm: filters.radiusKm,
  });
  res.json(matches.map((m) => serializeDonorPublic(m.donor, m.distanceKm)));
}
