import { Ambulance, AmbulanceRequest, DonorProfile, EmergencyRequest, InventoryItem, Organization, RequestResponse, User } from "@prisma/client";
import { BLOOD_GROUP_LABELS } from "@/utils/blood";
import { calculateAge, checkDonationEligibility } from "@/utils/eligibility";

export function serializeDonor(donor: DonorProfile & { user?: User }) {
  const eligibility = checkDonationEligibility(donor.lastDonationDate);
  return {
    id: donor.id,
    userId: donor.userId,
    fullName: donor.fullName,
    bloodGroup: BLOOD_GROUP_LABELS[donor.bloodGroup],
    gender: donor.gender,
    dateOfBirth: donor.dateOfBirth,
    age: calculateAge(donor.dateOfBirth),
    weightKg: donor.weightKg,
    lat: donor.lat,
    lng: donor.lng,
    address: donor.address,
    city: donor.city,
    state: donor.state,
    pincode: donor.pincode,
    isAvailable: donor.isAvailable,
    lastDonationDate: donor.lastDonationDate,
    totalDonations: donor.totalDonations,
    medicalNotes: donor.medicalNotes,
    isSmoker: donor.isSmoker,
    isAlcoholic: donor.isAlcoholic,
    usesDrugs: donor.usesDrugs,
    hasChronicIllness: donor.hasChronicIllness,
    chronicIllnessDetails: donor.chronicIllnessDetails,
    hasGeneticDisorder: donor.hasGeneticDisorder,
    geneticDisorderDetails: donor.geneticDisorderDetails,
    eligibility,
    email: donor.user?.email,
    phone: donor.user?.phone,
    createdAt: donor.createdAt,
  };
}

export function serializeDonorPublic(donor: DonorProfile, distanceKm?: number) {
  return {
    id: donor.id,
    bloodGroup: BLOOD_GROUP_LABELS[donor.bloodGroup],
    city: donor.city,
    isAvailable: donor.isAvailable,
    distanceKm,
  };
}

export function serializeOrganization(org: Organization & { user?: User }) {
  return {
    id: org.id,
    userId: org.userId,
    name: org.name,
    type: org.type,
    regNumber: org.regNumber,
    contactPerson: org.contactPerson,
    lat: org.lat,
    lng: org.lng,
    address: org.address,
    city: org.city,
    state: org.state,
    pincode: org.pincode,
    isVerified: org.isVerified,
    email: org.user?.email,
    phone: org.user?.phone,
    createdAt: org.createdAt,
  };
}

export function serializeInventoryItem(item: InventoryItem) {
  return {
    id: item.id,
    bloodGroup: BLOOD_GROUP_LABELS[item.bloodGroup],
    units: item.units,
    updatedAt: item.updatedAt,
  };
}

export function serializeRequest(
  request: EmergencyRequest & { organization?: Organization; responses?: RequestResponse[] }
) {
  return {
    id: request.id,
    organizationId: request.organizationId,
    organization: request.organization
      ? {
          id: request.organization.id,
          name: request.organization.name,
          type: request.organization.type,
          city: request.organization.city,
          lat: request.organization.lat,
          lng: request.organization.lng,
        }
      : undefined,
    bloodGroup: BLOOD_GROUP_LABELS[request.bloodGroup],
    unitsNeeded: request.unitsNeeded,
    unitsFulfilled: request.unitsFulfilled,
    urgency: request.urgency,
    status: request.status,
    patientInfo: request.patientInfo,
    notes: request.notes,
    lat: request.lat,
    lng: request.lng,
    address: request.address,
    expiresAt: request.expiresAt,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
    responseCount: request.responses?.length,
  };
}

export function serializeAmbulance(ambulance: Ambulance) {
  return {
    id: ambulance.id,
    organizationId: ambulance.organizationId,
    vehicleNumber: ambulance.vehicleNumber,
    driverName: ambulance.driverName,
    driverPhone: ambulance.driverPhone,
    status: ambulance.status,
    lat: ambulance.lat,
    lng: ambulance.lng,
    createdAt: ambulance.createdAt,
    updatedAt: ambulance.updatedAt,
  };
}

export function serializeAmbulanceRequest(ambulanceRequest: AmbulanceRequest & { ambulance?: Ambulance | null }) {
  return {
    id: ambulanceRequest.id,
    emergencyRequestId: ambulanceRequest.emergencyRequestId,
    responseId: ambulanceRequest.responseId,
    organizationId: ambulanceRequest.organizationId,
    ambulanceId: ambulanceRequest.ambulanceId,
    ambulance: ambulanceRequest.ambulance ? serializeAmbulance(ambulanceRequest.ambulance) : undefined,
    status: ambulanceRequest.status,
    pickupAddress: ambulanceRequest.pickupAddress,
    pickupLat: ambulanceRequest.pickupLat,
    pickupLng: ambulanceRequest.pickupLng,
    dropoffAddress: ambulanceRequest.dropoffAddress,
    dropoffLat: ambulanceRequest.dropoffLat,
    dropoffLng: ambulanceRequest.dropoffLng,
    notes: ambulanceRequest.notes,
    createdAt: ambulanceRequest.createdAt,
    updatedAt: ambulanceRequest.updatedAt,
  };
}

export function serializeResponse(response: RequestResponse & { donor?: User & { donorProfile?: DonorProfile | null } }) {
  return {
    id: response.id,
    requestId: response.requestId,
    donorUserId: response.donorUserId,
    status: response.status,
    distanceKm: response.distanceKm,
    respondedAt: response.respondedAt,
    donor: response.donor?.donorProfile
      ? {
          fullName: response.donor.donorProfile.fullName,
          bloodGroup: BLOOD_GROUP_LABELS[response.donor.donorProfile.bloodGroup],
          phone:
            response.status === "CONFIRMED" || response.status === "COMPLETED"
              ? response.donor.phone
              : undefined,
        }
      : undefined,
  };
}
