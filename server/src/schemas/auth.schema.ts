import { z } from "zod";
import { bloodGroupLabelSchema, latitudeSchema, longitudeSchema } from "@/schemas/common.schema";
import { calculateAge, MAX_DONOR_AGE, MIN_DONOR_AGE } from "@/utils/eligibility";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerDonorSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().min(7).max(20),
  fullName: z.string().min(2).max(100),
  bloodGroup: bloodGroupLabelSchema,
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  dateOfBirth: z.coerce.date().refine(
    (date) => !isNaN(date.getTime()) && calculateAge(date) >= MIN_DONOR_AGE && calculateAge(date) <= MAX_DONOR_AGE,
    { message: `Donor must be between ${MIN_DONOR_AGE} and ${MAX_DONOR_AGE} years old` }
  ),
  weightKg: z.coerce.number().positive().max(400),
  lat: latitudeSchema,
  lng: longitudeSchema,
  address: z.string().min(3).max(200),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  pincode: z.string().min(3).max(12),
  isSmoker: z.boolean().default(false),
  isAlcoholic: z.boolean().default(false),
  usesDrugs: z.boolean().default(false),
  hasChronicIllness: z.boolean().default(false),
  chronicIllnessDetails: z.string().max(500).optional(),
  hasGeneticDisorder: z.boolean().default(false),
  geneticDisorderDetails: z.string().max(500).optional(),
});
export type RegisterDonorInput = z.infer<typeof registerDonorSchema>;

export const registerOrganizationSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().min(7).max(20),
  name: z.string().min(2).max(150),
  type: z.enum(["HOSPITAL", "BLOOD_BANK"]),
  regNumber: z.string().min(2).max(100),
  contactPerson: z.string().min(2).max(100),
  lat: latitudeSchema,
  lng: longitudeSchema,
  address: z.string().min(3).max(200),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  pincode: z.string().min(3).max(12),
});
export type RegisterOrganizationInput = z.infer<typeof registerOrganizationSchema>;
