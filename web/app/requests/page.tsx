"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { ApiError, requestsApi } from "@/lib/api";
import { BLOOD_GROUPS } from "@/lib/constants";
import type { BloodGroupLabel, EmergencyRequest, RequestStatus } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { RequestCard } from "@/components/RequestCard";

const STATUS_OPTIONS: RequestStatus[] = ["OPEN", "PARTIALLY_FULFILLED", "FULFILLED", "CANCELLED", "EXPIRED"];

function RequestsBrowser() {
  const { user, donor } = useAuth();
  const { socket } = useSocket();
  const isOrg = user?.role === "HOSPITAL" || user?.role === "BLOOD_BANK";

  const [status, setStatus] = useState<RequestStatus | "">("OPEN");
  const [bloodGroup, setBloodGroup] = useState<BloodGroupLabel | "">("");
  const [mineOnly, setMineOnly] = useState(false);
  const [requests, setRequests] = useState<EmergencyRequest[] | null>(null);
  const [error, setError] = useState("");

  const fetchRequests = useCallback(async () => {
    setError("");
    try {
      const data = await requestsApi.list({
        status: status || undefined,
        bloodGroup: bloodGroup || undefined,
        mine: isOrg && mineOnly ? true : undefined,
        lat: !isOrg ? donor?.lat : undefined,
        lng: !isOrg ? donor?.lng : undefined,
      });
      setRequests(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load requests.");
      setRequests([]);
    }
  }, [status, bloodGroup, mineOnly, isOrg, donor]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount/filter-change is intentional
    fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    if (!socket) return;
    const onChange = () => fetchRequests();
    socket.on("request:new", onChange);
    socket.on("request:updated", onChange);
    return () => {
      socket.off("request:new", onChange);
      socket.off("request:updated", onChange);
    };
  }, [socket, fetchRequests]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Emergency requests</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {isOrg ? "Browse and manage emergency blood requests." : "Open requests you may be able to help with."}
          </p>
        </div>
        {isOrg && (
          <Link href="/dashboard/organization/requests/new">
            <Button>New request</Button>
          </Link>
        )}
      </div>

      <Card className="mt-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value as RequestStatus | "")}>
            <option value="">Any</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s.replace("_", " ")}
              </option>
            ))}
          </Select>
          <Select
            label="Blood group"
            value={bloodGroup}
            onChange={(e) => setBloodGroup(e.target.value as BloodGroupLabel | "")}
          >
            <option value="">Any</option>
            {BLOOD_GROUPS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </Select>
          {isOrg && (
            <label className="flex items-center gap-2 self-end pb-2 text-sm font-medium text-zinc-700">
              <input type="checkbox" checked={mineOnly} onChange={(e) => setMineOnly(e.target.checked)} />
              Only my organization&apos;s requests
            </label>
          )}
        </div>
      </Card>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {requests === null ? (
          <Spinner />
        ) : requests.length === 0 ? (
          <p className="text-sm text-zinc-500">No requests match your filters.</p>
        ) : (
          requests.map((request) => <RequestCard key={request.id} request={request} />)
        )}
      </div>
    </div>
  );
}

export default function RequestsPage() {
  return (
    <ProtectedRoute>
      <RequestsBrowser />
    </ProtectedRoute>
  );
}
