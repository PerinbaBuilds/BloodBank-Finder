import { REQUEST_STATUS_STYLES, RESPONSE_STATUS_STYLES, URGENCY_STYLES } from "@/lib/constants";
import type { BloodGroupLabel, RequestStatus, ResponseStatus, Urgency } from "@/lib/types";

function Badge({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${className}`}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
      {children}
    </span>
  );
}

export function BloodGroupBadge({ group }: { group: BloodGroupLabel }) {
  return <Badge className="border-red-300 bg-red-50 text-red-700">{group}</Badge>;
}

export function UrgencyBadge({ urgency }: { urgency: Urgency }) {
  return <Badge className={URGENCY_STYLES[urgency]}>{urgency}</Badge>;
}

export function RequestStatusBadge({ status }: { status: RequestStatus }) {
  return <Badge className={REQUEST_STATUS_STYLES[status]}>{status.replace("_", " ")}</Badge>;
}

export function ResponseStatusBadge({ status }: { status: ResponseStatus }) {
  return <Badge className={RESPONSE_STATUS_STYLES[status]}>{status}</Badge>;
}
