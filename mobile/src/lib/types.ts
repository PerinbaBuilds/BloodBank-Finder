export type Role = "DONOR" | "HOSPITAL" | "BLOOD_BANK" | "ADMIN";
export type OrgType = "HOSPITAL" | "BLOOD_BANK";
export type BloodGroupLabel = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
export type Gender = "MALE" | "FEMALE" | "OTHER";
export type Urgency = "CRITICAL" | "HIGH" | "MODERATE";
export type RequestStatus = "OPEN" | "PARTIALLY_FULFILLED" | "FULFILLED" | "CANCELLED" | "EXPIRED";
export type ResponseStatus = "OFFERED" | "CONFIRMED" | "COMPLETED" | "DECLINED" | "CANCELLED";

export interface PublicUser {
  id: string;
  email: string;
  role: Role;
  phone: string;
}

export interface Eligibility {
  isEligible: boolean;
  reason?: string;
  nextEligibleDate?: string;
}

export interface Donor {
  id: string;
  userId: string;
  fullName: string;
  bloodGroup: BloodGroupLabel;
  gender: Gender;
  dateOfBirth: string;
  age: number;
  weightKg: number;
  lat: number;
  lng: number;
  address: string;
  city: string;
  state: string;
  pincode: string;
  isAvailable: boolean;
  lastDonationDate: string | null;
  totalDonations: number;
  medicalNotes: string | null;
  isSmoker: boolean;
  isAlcoholic: boolean;
  usesDrugs: boolean;
  hasChronicIllness: boolean;
  chronicIllnessDetails: string | null;
  hasGeneticDisorder: boolean;
  geneticDisorderDetails: string | null;
  eligibility: Eligibility;
  email?: string;
  phone?: string;
  createdAt: string;
}

export interface DonorPublic {
  id: string;
  bloodGroup: BloodGroupLabel;
  city: string;
  isAvailable: boolean;
  distanceKm?: number;
}

export interface Organization {
  id: string;
  userId: string;
  name: string;
  type: OrgType;
  regNumber: string;
  contactPerson: string;
  lat: number;
  lng: number;
  address: string;
  city: string;
  state: string;
  pincode: string;
  isVerified: boolean;
  email?: string;
  phone?: string;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  bloodGroup: BloodGroupLabel;
  units: number;
  updatedAt: string;
}

export interface OrganizationWithInventory extends Organization {
  inventory: InventoryItem[];
  distanceKm?: number;
}

export interface RequestOrgSummary {
  id: string;
  name: string;
  type: OrgType;
  city: string;
  lat: number;
  lng: number;
}

export interface EmergencyRequest {
  id: string;
  organizationId: string;
  organization?: RequestOrgSummary;
  bloodGroup: BloodGroupLabel;
  unitsNeeded: number;
  unitsFulfilled: number;
  urgency: Urgency;
  status: RequestStatus;
  patientInfo?: string | null;
  notes?: string | null;
  lat: number;
  lng: number;
  address: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  responseCount?: number;
  distanceKm?: number;
}

export interface ResponseDonorSummary {
  fullName: string;
  bloodGroup: BloodGroupLabel;
  phone?: string;
}

export interface RequestResponseItem {
  id: string;
  requestId: string;
  donorUserId: string;
  status: ResponseStatus;
  distanceKm: number;
  respondedAt: string;
  donor?: ResponseDonorSummary;
}

export interface RequestDetail extends EmergencyRequest {
  responses: RequestResponseItem[];
}

export interface AppNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
}

export interface StatsOverview {
  donorCount: number;
  bloodBankCount: number;
  hospitalCount: number;
  activeRequests: number;
  unitsFulfilled: number;
  totalDonations: number;
}

export interface AuthResponse {
  token: string;
  user: PublicUser;
  donor?: Donor;
  organization?: Organization;
}

export interface RegisterDonorPayload {
  email: string;
  password: string;
  phone: string;
  fullName: string;
  bloodGroup: BloodGroupLabel;
  gender: Gender;
  dateOfBirth: string;
  weightKg: number;
  lat: number;
  lng: number;
  address: string;
  city: string;
  state: string;
  pincode: string;
  isSmoker: boolean;
  isAlcoholic: boolean;
  usesDrugs: boolean;
  hasChronicIllness: boolean;
  chronicIllnessDetails?: string;
  hasGeneticDisorder: boolean;
  geneticDisorderDetails?: string;
}

export interface RegisterOrganizationPayload {
  email: string;
  password: string;
  phone: string;
  name: string;
  type: OrgType;
  regNumber: string;
  contactPerson: string;
  lat: number;
  lng: number;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export type AmbulanceStatus = "AVAILABLE" | "ON_TRIP" | "OFFLINE";
export type AmbulanceRequestStatus =
  | "REQUESTED"
  | "ASSIGNED"
  | "EN_ROUTE"
  | "ARRIVED"
  | "COMPLETED"
  | "CANCELLED";

export interface Ambulance {
  id: string;
  organizationId: string;
  vehicleNumber: string;
  driverName: string;
  driverPhone: string;
  status: AmbulanceStatus;
  lat: number;
  lng: number;
  createdAt: string;
  updatedAt: string;
}

export interface AmbulanceRequestItem {
  id: string;
  emergencyRequestId: string;
  responseId: string | null;
  organizationId: string;
  ambulanceId: string | null;
  ambulance?: Ambulance;
  status: AmbulanceRequestStatus;
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  dropoffAddress: string;
  dropoffLat: number;
  dropoffLng: number;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DonationHistoryItem {
  id: string;
  requestId: string;
  bloodGroup: BloodGroupLabel;
  unitsNeeded: number;
  distanceKm: number;
  donatedAt: string;
  organization: {
    id: string;
    name: string;
    type: OrgType;
    city: string;
  };
}
