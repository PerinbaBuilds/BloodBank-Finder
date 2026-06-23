import { z } from "zod";
import { bloodGroupLabelSchema, latitudeSchema, longitudeSchema } from "@/schemas/common.schema";

export const updateDonorSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  phone: z.string().min(7).max(20).optional(),
  bloodGroup: bloodGroupLabelSchema.optional(),
  weightKg: z.coerce.number().positive().max(400).optional(),
  lat: latitudeSchema.optional(),
  lng: longitudeSchema.optional(),
  address: z.string().min(3).max(200).optional(),
  city: z.string().min(1).max(100).optional(),
  state: z.string().min(1).max(100).optional(),
  pincode: z.string().min(3).max(12).optional(),
  isAvailable: z.boolean().optional(),
  medicalNotes: z.string().max(1000).nullable().optional(),
  isSmoker: z.boolean().optional(),
  isAlcoholic: z.boolean().optional(),
  usesDrugs: z.boolean().optional(),
  hasChronicIllness: z.boolean().optional(),
  chronicIllnessDetails: z.string().max(500).nullable().optional(),
  hasGeneticDisorder: z.boolean().optional(),
  geneticDisorderDetails: z.string().max(500).nullable().optional(),
});
export type UpdateDonorInput = z.infer<typeof updateDonorSchema>;

export const recordDonationSchema = z.object({
  donationDate: z.coerce.date().optional(),
});

export const searchDonorsSchema = z.object({
  bloodGroup: bloodGroupLabelSchema.optional(),
  lat: latitudeSchema,
  lng: longitudeSchema,
  radiusKm: z.coerce.number().positive().max(200).default(15),
});
export type SearchDonorsInput = z.infer<typeof searchDonorsSchema>;
