"use client";

import { useState } from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { ApiError, donorsApi } from "@/lib/api";
import { BLOOD_GROUPS } from "@/lib/constants";
import type { BloodGroupLabel, DonorPublic } from "@/lib/types";
import { BloodGroupBadge } from "@/components/badges";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";
import { LocateButton } from "@/components/LocateButton";

function FindDonors() {
  const { organization } = useAuth();
  const [bloodGroup, setBloodGroup] = useState<BloodGroupLabel | "">("");
  const [radiusKm, setRadiusKm] = useState("15");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    organization ? { lat: organization.lat, lng: organization.lng } : null
  );
  const [results, setResults] = useState<DonorPublic[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!bloodGroup) {
      setError("Select a blood group to search.");
      return;
    }
    if (!coords) {
      setError("Set a location to search for donors.");
      return;
    }
    setIsSearching(true);
    try {
      const data = await donorsApi.search({
        bloodGroup,
        lat: coords.lat,
        lng: coords.lng,
        radiusKm: Number(radiusKm),
      });
      setResults(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Search failed. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold text-zinc-900">Find available donors</h1>
      <p className="mt-1 text-sm text-zinc-500">
        See how many compatible, available donors are nearby. To contact a donor,{" "}
        <Link href="/dashboard/organization/requests/new" className="font-medium text-red-600 hover:underline">
          post an emergency request
        </Link>{" "}
        — contact details are shared automatically once a donor responds and you confirm them.
      </p>

      <Card className="mt-6">
        <form onSubmit={handleSearch} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Blood group"
              required
              value={bloodGroup}
              onChange={(e) => setBloodGroup(e.target.value as BloodGroupLabel | "")}
            >
              <option value="">Select</option>
              {BLOOD_GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </Select>
            <Select label="Radius (km)" value={radiusKm} onChange={(e) => setRadiusKm(e.target.value)}>
              {["5", "10", "15", "25", "50", "100", "200"].map((r) => (
                <option key={r} value={r}>
                  {r} km
                </option>
              ))}
            </Select>
          </div>

          <div>
            <LocateButton onLocate={setCoords} />
            {coords && (
              <p className="mt-1 text-xs text-green-600">
                Searching near ({coords.lat.toFixed(4)}, {coords.lng.toFixed(4)})
              </p>
            )}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" isLoading={isSearching}>
            Search
          </Button>
        </form>
      </Card>

      {results && (
        <div className="mt-6">
          <p className="text-sm font-medium text-zinc-700">
            {results.length} available, eligible donor(s) found within {radiusKm} km
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {results.map((donor) => (
              <Card key={donor.id} className="flex items-center justify-between">
                <div>
                  <BloodGroupBadge group={donor.bloodGroup} />
                  <p className="mt-1 text-sm text-zinc-600">{donor.city}</p>
                </div>
                {donor.distanceKm !== undefined && <p className="text-xs text-zinc-500">~{donor.distanceKm} km</p>}
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function FindDonorsPage() {
  return (
    <ProtectedRoute roles={["HOSPITAL", "BLOOD_BANK"]}>
      <FindDonors />
    </ProtectedRoute>
  );
}
