import type { BloodGroupLabel, RequestStatus, ResponseStatus, Urgency } from "./types";

export const BLOOD_GROUPS: BloodGroupLabel[] = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export const URGENCY_COLORS: Record<Urgency, string> = {
  CRITICAL: "#dc2626",
  HIGH: "#ea580c",
  MODERATE: "#ca8a04",
};

export const REQUEST_STATUS_COLORS: Record<RequestStatus, string> = {
  OPEN: "#2563eb",
  PARTIALLY_FULFILLED: "#7c3aed",
  FULFILLED: "#16a34a",
  CANCELLED: "#52525b",
  EXPIRED: "#71717a",
};

export const RESPONSE_STATUS_COLORS: Record<ResponseStatus, string> = {
  OFFERED: "#2563eb",
  CONFIRMED: "#16a34a",
  COMPLETED: "#059669",
  DECLINED: "#52525b",
  CANCELLED: "#71717a",
};

export const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
  "Uttarakhand", "West Bengal", "Delhi", "Jammu and Kashmir", "Ladakh", "Puducherry",
];
