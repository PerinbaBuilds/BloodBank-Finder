"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, SearchX, ShieldCheck } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ApiError, adminApi } from "@/lib/api";
import type { Organization } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { PageHeader } from "@/components/PageHeader";

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
      <PageHeader
        icon={ShieldCheck}
        title="Organization verification"
        subtitle="Review and approve hospital and blood bank registrations."
        actions={
          <Select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} className="w-44">
            <option value="unverified">Pending verification</option>
            <option value="verified">Verified</option>
            <option value="all">All organizations</option>
          </Select>
        }
      />

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6 flex flex-col gap-3">
        {orgs === null ? (
          <Spinner />
        ) : orgs.length === 0 ? (
          <Card className="flex flex-col items-center gap-2 py-10 text-center">
            <SearchX className="h-8 w-8 text-zinc-300" />
            <p className="text-sm text-zinc-500">No organizations found for this filter.</p>
          </Card>
        ) : (
          orgs.map((org) => (
            <Card key={org.id} className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-zinc-900">{org.name}</p>
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600">
                    {org.type === "BLOOD_BANK" ? "Blood Bank" : "Hospital"}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {org.city} · Reg #{org.regNumber}
                </p>
                <p className="text-xs text-zinc-500">
                  Contact: {org.contactPerson} · {org.phone} · {org.email}
                </p>
              </div>
              {org.isVerified ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-sm font-medium text-green-700">
                  <CheckCircle2 className="h-4 w-4" /> Verified
                </span>
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
