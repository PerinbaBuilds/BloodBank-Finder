"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarClock, HeartHandshake, ShieldCheck } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { ApiError, donorsApi, requestsApi } from "@/lib/api";
import type { EmergencyRequest } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { RequestCard } from "@/components/RequestCard";
import { PageHeader } from "@/components/PageHeader";

function DonorDashboard() {
  const { donor, refresh } = useAuth();
  const [requests, setRequests] = useState<EmergencyRequest[] | null>(null);
  const [isTogglingAvailability, setIsTogglingAvailability] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!donor) return;
    requestsApi
      .list({ status: "OPEN", compatibleWithDonorBloodGroup: donor.bloodGroup, lat: donor.lat, lng: donor.lng })
      .then(setRequests)
      .catch(() => setRequests([]));
  }, [donor]);

  if (!donor) return <Spinner />;

  const toggleAvailability = async () => {
    setError("");
    setIsTogglingAvailability(true);
    try {
      await donorsApi.updateMe({ isAvailable: !donor.isAvailable });
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update availability.");
    } finally {
      setIsTogglingAvailability(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <PageHeader
        icon={HeartHandshake}
        title={`Welcome, ${donor.fullName}`}
        subtitle={`${donor.bloodGroup} donor in ${donor.city}`}
        actions={
          <>
            <Link href="/dashboard/donor/donations">
              <Button variant="outline" size="sm">
                My donations
              </Button>
            </Link>
            <Link href="/dashboard/donor/profile">
              <Button variant="outline" size="sm">
                Edit profile
              </Button>
            </Link>
          </>
        }
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <HeartHandshake className="h-5 w-5" />
          </span>
          <div>
            <p className="text-2xl font-bold text-zinc-900">{donor.totalDonations}</p>
            <p className="text-xs font-medium text-zinc-500">Total donations</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <CalendarClock className="h-5 w-5" />
          </span>
          <div>
            <p className="text-base font-bold text-zinc-900">
              {donor.lastDonationDate ? new Date(donor.lastDonationDate).toLocaleDateString() : "—"}
            </p>
            <p className="text-xs font-medium text-zinc-500">Last donation</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
              donor.eligibility.isEligible ? "bg-green-50 text-green-600" : "bg-orange-50 text-orange-600"
            }`}
          >
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <p className={`text-base font-bold ${donor.eligibility.isEligible ? "text-green-600" : "text-orange-600"}`}>
              {donor.eligibility.isEligible ? "Eligible" : "Not eligible"}
            </p>
            <p className="text-xs font-medium text-zinc-500">{donor.eligibility.reason ?? "You can donate now"}</p>
          </div>
        </Card>
      </div>

      <Card className="mt-6 flex items-center justify-between">
        <div>
          <p className="font-medium text-zinc-900">Availability</p>
          <p className="text-sm text-zinc-500">
            {donor.isAvailable
              ? "You're visible to hospitals searching for donors."
              : "You're hidden from donor searches."}
          </p>
        </div>
        <Button
          variant={donor.isAvailable ? "secondary" : "primary"}
          isLoading={isTogglingAvailability}
          onClick={toggleAvailability}
        >
          {donor.isAvailable ? "Set unavailable" : "Set available"}
        </Button>
      </Card>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-zinc-900">Requests matching your blood group</h2>
          <Link href="/requests" className="text-sm font-medium text-red-600 hover:underline">
            View all
          </Link>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {requests === null ? (
            <div className="sm:col-span-2">
              <Spinner />
            </div>
          ) : requests.length === 0 ? (
            <p className="text-sm text-zinc-500">
              No matching open requests right now. We&apos;ll notify you when one appears.
            </p>
          ) : (
            requests.slice(0, 4).map((request) => <RequestCard key={request.id} request={request} />)
          )}
        </div>
      </div>
    </div>
  );
}

export default function DonorDashboardPage() {
  return (
    <ProtectedRoute roles={["DONOR"]}>
      <DonorDashboard />
    </ProtectedRoute>
  );
}
