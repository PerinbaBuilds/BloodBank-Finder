import { BloodGroupBadge } from "@/components/badges";
import { Card } from "@/components/ui/Card";
import type { OrganizationWithInventory } from "@/lib/types";

export function OrgCard({ org }: { org: OrganizationWithInventory }) {
  const inStock = org.inventory.filter((item) => item.units > 0);
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-zinc-900">{org.name}</p>
          <p className="text-xs text-zinc-500">
            {org.address}, {org.city}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-700">
          {org.type === "BLOOD_BANK" ? "Blood Bank" : "Hospital"}
        </span>
      </div>

      {org.distanceKm !== undefined && <p className="text-xs text-zinc-500">~{org.distanceKm} km away</p>}

      {org.type === "BLOOD_BANK" && (
        <div className="flex flex-wrap gap-2">
          {inStock.length === 0 ? (
            <p className="text-xs text-zinc-400">No stock reported</p>
          ) : (
            inStock.map((item) => (
              <div key={item.id} className="flex items-center gap-1">
                <BloodGroupBadge group={item.bloodGroup} />
                <span className="text-xs text-zinc-500">×{item.units}</span>
              </div>
            ))
          )}
        </div>
      )}

      <div className="flex items-center gap-2 text-xs text-zinc-500">
        {org.isVerified ? <span className="text-green-600">Verified</span> : <span>Pending verification</span>}
        {org.phone && <span>· {org.phone}</span>}
      </div>
    </Card>
  );
}
