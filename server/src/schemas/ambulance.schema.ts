import { z } from "zod";
import { latitudeSchema, longitudeSchema } from "@/schemas/common.schema";

export const createAmbulanceSchema = z.object({
  vehicleNumber: z.string().min(2).max(20),
  driverName: z.string().min(2).max(100),
  driverPhone: z.string().min(7).max(20),
  lat: latitudeSchema.optional(),
  lng: longitudeSchema.optional(),
});
export type CreateAmbulanceInput = z.infer<typeof createAmbulanceSchema>;

export const updateAmbulanceSchema = z.object({
  driverName: z.string().min(2).max(100).optional(),
  driverPhone: z.string().min(7).max(20).optional(),
  status: z.enum(["AVAILABLE", "ON_TRIP", "OFFLINE"]).optional(),
  lat: latitudeSchema.optional(),
  lng: longitudeSchema.optional(),
});
export type UpdateAmbulanceInput = z.infer<typeof updateAmbulanceSchema>;

export const createAmbulanceRequestSchema = z.object({
  emergencyRequestId: z.string().min(1),
  responseId: z.string().min(1).optional(),
  ambulanceId: z.string().min(1).optional(),
  pickupAddress: z.string().min(3).max(200),
  pickupLat: latitudeSchema,
  pickupLng: longitudeSchema,
  dropoffAddress: z.string().min(3).max(200).optional(),
  dropoffLat: latitudeSchema.optional(),
  dropoffLng: longitudeSchema.optional(),
  notes: z.string().max(1000).optional(),
});
export type CreateAmbulanceRequestInput = z.infer<typeof createAmbulanceRequestSchema>;

export const listAmbulanceRequestsSchema = z.object({
  status: z.enum(["REQUESTED", "ASSIGNED", "EN_ROUTE", "ARRIVED", "COMPLETED", "CANCELLED"]).optional(),
});
export type ListAmbulanceRequestsInput = z.infer<typeof listAmbulanceRequestsSchema>;

export const updateAmbulanceRequestSchema = z.object({
  status: z.enum(["ASSIGNED", "EN_ROUTE", "ARRIVED", "COMPLETED", "CANCELLED"]).optional(),
  ambulanceId: z.string().min(1).optional(),
  notes: z.string().max(1000).optional(),
});
export type UpdateAmbulanceRequestInput = z.infer<typeof updateAmbulanceRequestSchema>;
