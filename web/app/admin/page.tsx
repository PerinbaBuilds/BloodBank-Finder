"use client";

import { useCallback, useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ApiError, adminApi } from "@/lib/api";
import type { Organization } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";

function VerificationQueue() {
  const [filter, setFilter] = useState<"unverified" | "verified" | "all">("unverified");
  const [orgs, setOrgs] = useState<Organization[] | null>(null);
  const [error, setError] = useState("");
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError("");
    try {
      const verified = filter === "all" ? undefined : filter === "verified";
      const data = await adminApi.listOrganizations(verified);
      setOrgs(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load organizations.");
      setOrgs([]);
    }
  }, [filter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount/filter-change is intentional
    load();
  }, [load]);

  const handleVerify = async (id: string) => {
    setVerifyingId(id);
    try {
      await adminApi.verifyOrganization(id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not verify this organization.");
    } finally {
      setVerifyingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-zinc-900">Organization verification</h1>
        <Select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} className="w-44">
          <option value="unverified">Pending verification</option>
          <option value="verified">Verified</option>
          <option value="all">All organizations</option>
        </Select>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6 flex flex-col gap-3">
        {orgs === null ? (
          <Spinner />
        ) : orgs.length === 0 ? (
          <p className="text-sm text-zinc-500">No organizations found.</p>
        ) : (
          orgs.map((org) => (
            <Card key={org.id} className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-zinc-900">{org.name}</p>
                <p className="text-xs text-zinc-500">
                  {org.type === "BLOOD_BANK" ? "Blood Bank" : "Hospital"} · {org.city} · Reg #{org.regNumber}
                </p>
                <p className="text-xs text-zinc-500">
                  Contact: {org.contactPerson} · {org.phone} · {org.email}
                </p>
              </div>
              {org.isVerified ? (
                <span className="text-sm font-medium text-green-600">Verified</span>
              ) : (
                <Button size="sm" isLoading={verifyingId === org.id} onClick={() => handleVerify(org.id)}>
                  Verify
                </Button>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <ProtectedRoute roles={["ADMIN"]}>
      <VerificationQueue />
    </ProtectedRoute>
  );
}
