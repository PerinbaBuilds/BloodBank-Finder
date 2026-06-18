import Link from "next/link";
import { BloodGroupBadge, RequestStatusBadge, UrgencyBadge } from "@/components/badges";
import { Card } from "@/components/ui/Card";
import type { EmergencyRequest } from "@/lib/types";

function timeRemaining(expiresAt: string): string {
  const diffMs = new Date(expiresAt).getTime() - Date.now();
  if (diffMs <= 0) return "Expired";
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return `${Math.max(1, Math.floor(diffMs / (1000 * 60)))}m left`;
  if (hours < 24) return `${hours}h left`;
  return `${Math.floor(hours / 24)}d left`;
}

export function RequestCard({ request }: { request: EmergencyRequest }) {
  return (
    <Link href={`/requests/${request.id}`}>
      <Card className="flex flex-col gap-3 transition-shadow hover:shadow-md">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-zinc-900">{request.organization?.name ?? "Organization"}</p>
            <p className="text-xs text-zinc-500">{request.organization?.city ?? request.address}</p>
          </div>
          <BloodGroupBadge group={request.bloodGroup} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <UrgencyBadge urgency={request.urgency} />
          <RequestStatusBadge status={request.status} />
        </div>
        <div className="flex items-center justify-between text-sm text-zinc-600">
          <span>
            {request.unitsFulfilled}/{request.unitsNeeded} units fulfilled
          </span>
          <span className="font-medium text-zinc-900">{timeRemaining(request.expiresAt)}</span>
        </div>
        {request.distanceKm !== undefined && <p className="text-xs text-zinc-500">~{request.distanceKm} km away</p>}
      </Card>
    </Link>
  );
}
