"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { ApiError, donorsApi, requestsApi } from "@/lib/api";
import type { EmergencyRequest } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { RequestCard } from "@/components/RequestCard";

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
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Welcome, {donor.fullName}</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {donor.bloodGroup} donor in {donor.city}
          </p>
        </div>
        <Link href="/dashboard/donor/profile">
          <Button variant="outline" size="sm">
            Edit profile
          </Button>
        </Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card className="text-center">
          <p className="text-2xl font-bold text-red-600">{donor.totalDonations}</p>
          <p className="mt-1 text-sm text-zinc-600">Total donations</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-red-600">
            {donor.lastDonationDate ? new Date(donor.lastDonationDate).toLocaleDateString() : "—"}
          </p>
          <p className="mt-1 text-sm text-zinc-600">Last donation</p>
        </Card>
        <Card className="text-center">
          <p className={`text-2xl font-bold ${donor.eligibility.isEligible ? "text-green-600" : "text-orange-600"}`}>
            {donor.eligibility.isEligible ? "Eligible" : "Not eligible"}
          </p>
          <p className="mt-1 text-sm text-zinc-600">{donor.eligibility.reason ?? "You can donate now"}</p>
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
