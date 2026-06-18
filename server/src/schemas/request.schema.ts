import { z } from "zod";
import { bloodGroupLabelSchema, latitudeSchema, longitudeSchema } from "@/schemas/common.schema";

export const createRequestSchema = z.object({
  bloodGroup: bloodGroupLabelSchema,
  unitsNeeded: z.coerce.number().int().positive().max(50),
  urgency: z.enum(["CRITICAL", "HIGH", "MODERATE"]),
  patientInfo: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
  lat: latitudeSchema.optional(),
  lng: longitudeSchema.optional(),
  address: z.string().min(3).max(200).optional(),
  expiresInHours: z.coerce.number().positive().max(168).default(24),
});
export type CreateRequestInput = z.infer<typeof createRequestSchema>;

export const listRequestsSchema = z.object({
  status: z.enum(["OPEN", "PARTIALLY_FULFILLED", "FULFILLED", "CANCELLED", "EXPIRED"]).optional(),
  bloodGroup: bloodGroupLabelSchema.optional(),
  compatibleWithDonorBloodGroup: bloodGroupLabelSchema.optional(),
  mine: z.coerce.boolean().optional(),
  lat: latitudeSchema.optional(),
  lng: longitudeSchema.optional(),
  radiusKm: z.coerce.number().positive().max(500).default(15),
});
export type ListRequestsInput = z.infer<typeof listRequestsSchema>;

export const updateRequestSchema = z.object({
  status: z.enum(["OPEN", "PARTIALLY_FULFILLED", "FULFILLED", "CANCELLED"]).optional(),
  unitsFulfilled: z.coerce.number().int().min(0).optional(),
  notes: z.string().max(1000).optional(),
});
export type UpdateRequestInput = z.infer<typeof updateRequestSchema>;

export const updateResponseSchema = z.object({
  status: z.enum(["CONFIRMED", "COMPLETED", "DECLINED", "CANCELLED"]),
});
export type UpdateResponseInput = z.infer<typeof updateResponseSchema>;
