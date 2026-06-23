import type {
  Ambulance,
  AmbulanceRequestItem,
  AmbulanceRequestStatus,
  AmbulanceStatus,
  AppNotification,
  AuthResponse,
  Donor,
  DonationHistoryItem,
  DonorPublic,
  EmergencyRequest,
  InventoryItem,
  Organization,
  OrganizationWithInventory,
  RegisterDonorPayload,
  RegisterOrganizationPayload,
  RequestDetail,
  RequestResponseItem,
  RequestStatus,
  ResponseStatus,
  StatsOverview,
  BloodGroupLabel,
  OrgType,
  Urgency,
} from "./types";
import { getToken } from "./storage";

export const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000/api";

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
    this.name = "ApiError";
  }
}

function buildQuery(params?: Record<string, unknown>): string {
  if (!params) return "";
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const headers = new Headers(options.headers);
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 204) {
    return undefined as T;
  }

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json() : undefined;

  if (!res.ok) {
    const message = (body && typeof body === "object" && "message" in body && typeof body.message === "string")
      ? body.message
      : res.statusText;
    throw new ApiError(res.status, message, body?.details);
  }

  return body as T;
}

export const authApi = {
  registerDonor: (input: RegisterDonorPayload) =>
    apiFetch<AuthResponse>("/auth/register/donor", { method: "POST", body: JSON.stringify(input) }),
  registerOrganization: (input: RegisterOrganizationPayload) =>
    apiFetch<AuthResponse>("/auth/register/organization", { method: "POST", body: JSON.stringify(input) }),
  login: (input: { email: string; password: string }) =>
    apiFetch<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify(input) }),
  logout: () => apiFetch<void>("/auth/logout", { method: "POST" }),
  me: () => apiFetch<{ user: AuthResponse["user"]; donor?: Donor; organization?: Organization }>("/auth/me"),
};

export const donorsApi = {
  getMe: () => apiFetch<Donor>("/donors/me"),
  updateMe: (
    input: Partial<
      Pick<
        RegisterDonorPayload,
        | "fullName" | "phone" | "bloodGroup" | "weightKg" | "lat" | "lng"
        | "address" | "city" | "state" | "pincode"
        | "isSmoker" | "isAlcoholic" | "usesDrugs" | "hasChronicIllness" | "hasGeneticDisorder"
      >
    > & {
      isAvailable?: boolean;
      medicalNotes?: string | null;
      chronicIllnessDetails?: string | null;
      geneticDisorderDetails?: string | null;
    }
  ) => apiFetch<Donor>("/donors/me", { method: "PUT", body: JSON.stringify(input) }),
  search: (params: { bloodGroup?: BloodGroupLabel; lat: number; lng: number; radiusKm?: number }) =>
    apiFetch<DonorPublic[]>(`/donors/search${buildQuery(params)}`),
  getMyDonations: () => apiFetch<DonationHistoryItem[]>("/donors/me/donations"),
};

export const organizationsApi = {
  search: (params: { type?: OrgType; bloodGroup?: BloodGroupLabel; city?: string; lat?: number; lng?: number; radiusKm?: number }) =>
    apiFetch<OrganizationWithInventory[]>(`/organizations/search${buildQuery(params)}`),
  getMe: () => apiFetch<Organization>("/organizations/me"),
  updateMe: (input: Partial<Pick<RegisterOrganizationPayload, "name" | "phone" | "contactPerson" | "lat" | "lng" | "address" | "city" | "state" | "pincode">>) =>
    apiFetch<Organization>("/organizations/me", { method: "PUT", body: JSON.stringify(input) }),
  getById: (id: string) => apiFetch<OrganizationWithInventory>(`/organizations/${id}`),
};

export const inventoryApi = {
  getMine: () => apiFetch<InventoryItem[]>("/inventory/me"),
  upsertMine: (items: { bloodGroup: BloodGroupLabel; units: number }[]) =>
    apiFetch<InventoryItem[]>("/inventory/me", { method: "PUT", body: JSON.stringify({ items }) }),
};

export const requestsApi = {
  create: (input: {
    bloodGroup: BloodGroupLabel;
    unitsNeeded: number;
    urgency: Urgency;
    patientInfo?: string;
    notes?: string;
    lat?: number;
    lng?: number;
    address?: string;
    expiresInHours?: number;
  }) => apiFetch<{ request: EmergencyRequest; matchedDonorCount: number }>("/requests", { method: "POST", body: JSON.stringify(input) }),
  list: (params: {
    status?: RequestStatus;
    bloodGroup?: BloodGroupLabel;
    compatibleWithDonorBloodGroup?: BloodGroupLabel;
    mine?: boolean;
    lat?: number;
    lng?: number;
    radiusKm?: number;
  } = {}) => apiFetch<EmergencyRequest[]>(`/requests${buildQuery(params)}`),
  get: (id: string) => apiFetch<RequestDetail>(`/requests/${id}`),
  update: (id: string, input: { status?: RequestStatus; unitsFulfilled?: number; notes?: string }) =>
    apiFetch<EmergencyRequest>(`/requests/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
  respond: (id: string) => apiFetch<RequestResponseItem>(`/requests/${id}/responses`, { method: "POST" }),
  updateResponse: (id: string, responseId: string, status: ResponseStatus) =>
    apiFetch<RequestResponseItem>(`/requests/${id}/responses/${responseId}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
};

export const ambulancesApi = {
  list: () => apiFetch<Ambulance[]>("/ambulances"),
  create: (input: { vehicleNumber: string; driverName: string; driverPhone: string; lat?: number; lng?: number }) =>
    apiFetch<Ambulance>("/ambulances", { method: "POST", body: JSON.stringify(input) }),
  update: (id: string, input: { driverName?: string; driverPhone?: string; status?: AmbulanceStatus; lat?: number; lng?: number }) =>
    apiFetch<Ambulance>(`/ambulances/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
};

export const ambulanceRequestsApi = {
  create: (input: {
    emergencyRequestId: string;
    responseId?: string;
    ambulanceId?: string;
    pickupAddress: string;
    pickupLat: number;
    pickupLng: number;
    dropoffAddress?: string;
    dropoffLat?: number;
    dropoffLng?: number;
    notes?: string;
  }) => apiFetch<AmbulanceRequestItem>("/ambulances/requests", { method: "POST", body: JSON.stringify(input) }),
  list: (params: { status?: AmbulanceRequestStatus } = {}) =>
    apiFetch<AmbulanceRequestItem[]>(`/ambulances/requests${buildQuery(params)}`),
  get: (id: string) => apiFetch<AmbulanceRequestItem>(`/ambulances/requests/${id}`),
  update: (id: string, input: { status?: AmbulanceRequestStatus; ambulanceId?: string; notes?: string }) =>
    apiFetch<AmbulanceRequestItem>(`/ambulances/requests/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
};

export const notificationsApi = {
  list: () => apiFetch<AppNotification[]>("/notifications"),
  markRead: (id: string) => apiFetch<AppNotification>(`/notifications/${id}/read`, { method: "PATCH" }),
  markAllRead: () => apiFetch<void>("/notifications/read-all", { method: "PATCH" }),
};

export const statsApi = {
  overview: () => apiFetch<StatsOverview>("/stats/overview"),
};

export const adminApi = {
  listOrganizations: (verified?: boolean) =>
    apiFetch<Organization[]>(`/admin/organizations${buildQuery({ verified })}`),
  verifyOrganization: (id: string) =>
    apiFetch<Organization>(`/admin/organizations/${id}/verify`, { method: "PATCH" }),
};
