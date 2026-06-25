"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Ambulance as AmbulanceIcon, Phone, User } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { ApiError, ambulanceRequestsApi, ambulancesApi } from "@/lib/api";
import type { Ambulance, AmbulanceRequestItem, AmbulanceRequestStatus } from "@/lib/types";
import { AmbulanceRequestStatusBadge } from "@/components/badges";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Spinner } from "@/components/ui/Spinner";
import { PageHeader } from "@/components/PageHeader";
import { MapView } from "@/components/MapViewLazy";

const NEXT_STATUS: Partial<Record<AmbulanceRequestStatus, { status: AmbulanceRequestStatus; label: string }>> = {
  ASSIGNED: { status: "EN_ROUTE", label: "Mark en route" },
  EN_ROUTE: { status: "ARRIVED", label: "Mark arrived" },
  ARRIVED: { status: "COMPLETED", label: "Mark completed" },
};
const TERMINAL: AmbulanceRequestStatus[] = ["COMPLETED", "CANCELLED"];

function DispatchDetail() {
  const { id } = useParams<{ id: string }>();
  const { organization } = useAuth();
  const { socket } = useSocket();
  const [dispatch, setDispatch] = useState<AmbulanceRequestItem | null>(null);
  const [availableAmbulances, setAvailableAmbulances] = useState<Ambulance[]>([]);
  const [error, setError] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await ambulanceRequestsApi.get(id);
      setDispatch(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load this dispatch.");
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount/id-change is intentional
    load();
  }, [load]);

  useEffect(() => {
    if (!socket) return;
    const handleUpdate = (updated: AmbulanceRequestItem) => {
      if (updated.id === id) setDispatch(updated);
    };
    socket.on("ambulance:updated", handleUpdate);
    return () => {
      socket.off("ambulance:updated", handleUpdate);
    };
  }, [socket, id]);

  useEffect(() => {
    if (!organization || dispatch?.organizationId !== organization.id) return;
    ambulancesApi
      .list()
      .then((all) => setAvailableAmbulances(all.filter((a) => a.status === "AVAILABLE")))
      .catch(() => setAvailableAmbulances([]));
  }, [organization, dispatch?.organizationId]);

  if (error) return <p className="mx-auto max-w-2xl px-4 py-12 text-sm text-red-600">{error}</p>;
  if (!dispatch) return <Spinner />;

  const isOwningOrg = organization?.id === dispatch.organizationId;
  const isTerminal = TERMINAL.includes(dispatch.status);
  const next = NEXT_STATUS[dispatch.status];

  const assign = async (ambulanceId: string) => {
    if (!ambulanceId) return;
    setIsUpdating(true);
    try {
      const updated = await ambulanceRequestsApi.update(dispatch.id, { ambulanceId });
      setDispatch(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not assign this ambulance.");
    } finally {
      setIsUpdating(false);
    }
  };

  const advance = async (status: AmbulanceRequestStatus) => {
    setIsUpdating(true);
    try {
      const updated = await ambulanceRequestsApi.update(dispatch.id, { status });
      setDispatch(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update this dispatch.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link href={isOwningOrg ? "/dashboard/organization/ambulances" : "/notifications"} className="text-sm font-medium text-red-600 hover:underline">
        ← Back
      </Link>

      <div className="mt-4">
        <PageHeader
          icon={AmbulanceIcon}
          title="Ambulance dispatch"
          subtitle={`Requested ${new Date(dispatch.createdAt).toLocaleString()}`}
          actions={<AmbulanceRequestStatusBadge status={dispatch.status} />}
        />
      </div>

      <Card className="mt-4 flex flex-col gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Pickup</p>
          <p className="text-sm text-zinc-800">{dispatch.pickupAddress}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Dropoff</p>
          <p className="text-sm text-zinc-800">{dispatch.dropoffAddress}</p>
        </div>
        {dispatch.notes && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Notes</p>
            <p className="text-sm text-zinc-800">{dispatch.notes}</p>
          </div>
        )}

        {dispatch.ambulance ? (
          <div className="flex flex-wrap items-center gap-4 rounded-lg bg-zinc-50 px-3 py-2">
            <p className="flex items-center gap-1.5 text-sm font-medium text-zinc-800">
              <AmbulanceIcon className="h-4 w-4 text-red-600" /> {dispatch.ambulance.vehicleNumber}
            </p>
            <p className="flex items-center gap-1.5 text-sm text-zinc-600">
              <User className="h-3.5 w-3.5 text-zinc-400" /> {dispatch.ambulance.driverName}
            </p>
            <a
              href={`tel:${dispatch.ambulance.driverPhone}`}
              className="flex items-center gap-1.5 text-sm font-medium text-red-600 hover:underline"
            >
              <Phone className="h-3.5 w-3.5" /> {dispatch.ambulance.driverPhone}
            </a>
          </div>
        ) : (
          isOwningOrg &&
          !isTerminal && (
            <Select value="" onChange={(e) => assign(e.target.value)} disabled={isUpdating || availableAmbulances.length === 0}>
              <option value="">{availableAmbulances.length === 0 ? "No ambulances available" : "Assign an ambulance…"}</option>
              {availableAmbulances.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.vehicleNumber} · {a.driverName}
                </option>
              ))}
            </Select>
          )
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        {isOwningOrg && !isTerminal && (
          <div className="flex flex-wrap items-center gap-2">
            {next && (
              <Button size="sm" isLoading={isUpdating} onClick={() => advance(next.status)}>
                {next.label}
              </Button>
            )}
            <Button size="sm" variant="ghost" isLoading={isUpdating} onClick={() => advance("CANCELLED")}>
              Cancel dispatch
            </Button>
          </div>
        )}
      </Card>

      <div className="mt-4">
        <MapView
          center={[dispatch.pickupLat, dispatch.pickupLng]}
          markers={[
            { id: "pickup", lat: dispatch.pickupLat, lng: dispatch.pickupLng, label: "Pickup", description: dispatch.pickupAddress },
            { id: "dropoff", lat: dispatch.dropoffLat, lng: dispatch.dropoffLng, label: "Dropoff", description: dispatch.dropoffAddress },
          ]}
          height="280px"
        />
      </div>
    </div>
  );
}

export default function AmbulanceRequestDetailPage() {
  return (
    <ProtectedRoute>
      <DispatchDetail />
    </ProtectedRoute>
  );
}
