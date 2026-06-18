import { z } from "zod";
import { bloodGroupLabelSchema, latitudeSchema, longitudeSchema } from "@/schemas/common.schema";

export const updateOrganizationSchema = z.object({
  name: z.string().min(2).max(150).optional(),
  phone: z.string().min(7).max(20).optional(),
  contactPerson: z.string().min(2).max(100).optional(),
  lat: latitudeSchema.optional(),
  lng: longitudeSchema.optional(),
  address: z.string().min(3).max(200).optional(),
  city: z.string().min(1).max(100).optional(),
  state: z.string().min(1).max(100).optional(),
  pincode: z.string().min(3).max(12).optional(),
});
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;

export const searchOrganizationsSchema = z.object({
  type: z.enum(["HOSPITAL", "BLOOD_BANK"]).optional(),
  bloodGroup: bloodGroupLabelSchema.optional(),
  city: z.string().min(1).max(100).optional(),
  lat: latitudeSchema.optional(),
  lng: longitudeSchema.optional(),
  radiusKm: z.coerce.number().positive().max(500).default(25),
});
export type SearchOrganizationsInput = z.infer<typeof searchOrganizationsSchema>;
