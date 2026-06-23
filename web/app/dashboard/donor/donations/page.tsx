"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HeartHandshake } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { donorsApi } from "@/lib/api";
import type { DonationHistoryItem } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { PageHeader } from "@/components/PageHeader";
import { BloodGroupBadge } from "@/components/badges";

function DonationHistory() {
  const [donations, setDonations] = useState<DonationHistoryItem[] | null>(null);

  useEffect(() => {
    donorsApi
      .getMyDonations()
      .then(setDonations)
      .catch(() => setDonations([]));
  }, []);

  const totalUnits = donations?.length ?? 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <PageHeader
        icon={HeartHandshake}
        title="Your donation history"
        subtitle="Every completed donation that helped save a life."
      />

      {donations === null ? (
        <Spinner />
      ) : donations.length === 0 ? (
        <Card className="mt-6 flex flex-col items-center gap-2 py-10 text-center">
          <HeartHandshake className="h-8 w-8 text-zinc-300" />
          <p className="text-sm text-zinc-500">
            You haven&apos;t completed a donation yet.{" "}
            <Link href="/requests" className="font-medium text-red-600 hover:underline">
              Browse open requests
            </Link>{" "}
            to find one near you.
          </p>
        </Card>
      ) : (
        <>
          <p className="mt-6 text-sm font-medium text-zinc-600">
            {totalUnits} completed donation{totalUnits === 1 ? "" : "s"}
          </p>
          <div className="mt-4 flex flex-col gap-3">
            {donations.map((donation) => (
              <Card key={donation.id} className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-zinc-900">{donation.organization.name}</p>
                    <BloodGroupBadge group={donation.bloodGroup} />
                  </div>
                  <p className="text-xs text-zinc-500">
                    {donation.organization.type === "BLOOD_BANK" ? "Blood Bank" : "Hospital"} ·{" "}
                    {donation.organization.city} · ~{donation.distanceKm} km away
                  </p>
                </div>
                <p className="text-sm text-zinc-500">{new Date(donation.donatedAt).toLocaleDateString()}</p>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function DonationHistoryPage() {
  return (
    <ProtectedRoute roles={["DONOR"]}>
      <DonationHistory />
    </ProtectedRoute>
  );
}
