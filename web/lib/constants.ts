import type { BloodGroupLabel, RequestStatus, ResponseStatus, Urgency } from "./types";

export const BLOOD_GROUPS: BloodGroupLabel[] = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export const URGENCY_STYLES: Record<Urgency, string> = {
  CRITICAL: "bg-red-100 text-red-800 border-red-300",
  HIGH: "bg-orange-100 text-orange-800 border-orange-300",
  MODERATE: "bg-yellow-100 text-yellow-800 border-yellow-300",
};

export const REQUEST_STATUS_STYLES: Record<RequestStatus, string> = {
  OPEN: "bg-blue-100 text-blue-800 border-blue-300",
  PARTIALLY_FULFILLED: "bg-purple-100 text-purple-800 border-purple-300",
  FULFILLED: "bg-green-100 text-green-800 border-green-300",
  CANCELLED: "bg-zinc-200 text-zinc-700 border-zinc-300",
  EXPIRED: "bg-zinc-200 text-zinc-500 border-zinc-300",
};

export const RESPONSE_STATUS_STYLES: Record<ResponseStatus, string> = {
  OFFERED: "bg-blue-100 text-blue-800 border-blue-300",
  CONFIRMED: "bg-green-100 text-green-800 border-green-300",
  COMPLETED: "bg-emerald-100 text-emerald-800 border-emerald-300",
  DECLINED: "bg-zinc-200 text-zinc-700 border-zinc-300",
  CANCELLED: "bg-zinc-200 text-zinc-500 border-zinc-300",
};

export const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
  "Uttarakhand", "West Bengal", "Delhi", "Jammu and Kashmir", "Ladakh", "Puducherry",
];
