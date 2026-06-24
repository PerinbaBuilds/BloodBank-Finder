"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Ambulance as AmbulanceIcon, Phone, User } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ApiError, ambulanceRequestsApi, ambulancesApi } from "@/lib/api";
import type { Ambulance, AmbulanceRequestItem, AmbulanceRequestStatus } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { PageHeader } from "@/components/PageHeader";
import { AmbulanceRequestStatusBadge, AmbulanceStatusBadge } from "@/components/badges";
import { LocationField } from "@/components/LocationField";

const NEXT_STATUS: Partial<Record<AmbulanceRequestStatus, { status: AmbulanceRequestStatus; label: string }>> = {
  ASSIGNED: { status: "EN_ROUTE", label: "Mark en route" },
  EN_ROUTE: { status: "ARRIVED", label: "Mark arrived" },
  ARRIVED: { status: "COMPLETED", label: "Mark completed" },
};
const TERMINAL: AmbulanceRequestStatus[] = ["COMPLETED", "CANCELLED"];

function RegisterAmbulanceForm({ onCreated }: { onCreated: (ambulance: Ambulance) => void }) {
  const [form, setForm] = useState({ vehicleNumber: "", driverName: "", driverPhone: "" });
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const ambulance = await ambulancesApi.create({ ...form, lat: coords?.lat, lng: coords?.lng });
      onCreated(ambulance);
      setForm({ vehicleNumber: "", driverName: "", driverPhone: "" });
      setCoords(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not register ambulance.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <h2 className="text-lg font-bold text-zinc-900">Register a new ambulance</h2>
      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <Input
            label="Vehicle number"
            placeholder="TN-09-AB-1234"
            required
            value={form.vehicleNumber}
            onChange={update("vehicleNumber")}
          />
          <Input label="Driver name" required value={form.driverName} onChange={update("driverName")} />
          <Input
            label="Driver phone"
            placeholder="+91-9876543210"
            required
            value={form.driverPhone}
            onChange={update("driverPhone")}
          />
        </div>
        <div>
          <LocationField onLocate={setCoords} />
          <p className={`mt-1 text-xs ${coords ? "text-green-600" : "text-zinc-500"}`}>
            {coords ? `Base location set (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})` : "Leave unset to use your organization's registered location."}
          </p>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" isLoading={isSubmitting} className="self-start">
          Register ambulance
        </Button>
      </form>
    </Card>
  );
}

function FleetList({ ambulances, onUpdated }: { ambulances: Ambulance[]; onUpdated: (a: Ambulance) => void }) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const setStatus = async (ambulance: Ambulance, status: "AVAILABLE" | "OFFLINE") => {
    setUpdatingId(ambulance.id);
    try {
      const updated = await ambulancesApi.update(ambulance.id, { status });
      onUpdated(updated);
    } catch {
      // surfaced implicitly by the badge not changing; keep UI simple
    } finally {
      setUpdatingId(null);
    }
  };

  if (ambulances.length === 0) {
    return <p className="text-sm text-zinc-500">No ambulances registered yet. Add your first one above.</p>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {ambulances.map((ambulance) => (
        <Card key={ambulance.id} className="flex flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-zinc-900">{ambulance.vehicleNumber}</p>
            <AmbulanceStatusBadge status={ambulance.status} />
          </div>
          <p className="flex items-center gap-1.5 text-sm text-zinc-600">
            <User className="h-3.5 w-3.5 text-zinc-400" /> {ambulance.driverName}
          </p>
          <p className="flex items-center gap-1.5 text-sm text-zinc-600">
            <Phone className="h-3.5 w-3.5 text-zinc-400" /> {ambulance.driverPhone}
          </p>
          <div className="mt-1">
            {ambulance.status === "AVAILABLE" && (
              <Button
                size="sm"
                variant="outline"
                isLoading={updatingId === ambulance.id}
                onClick={() => setStatus(ambulance, "OFFLINE")}
              >
                Take offline
              </Button>
            )}
            {ambulance.status === "OFFLINE" && (
              <Button size="sm" isLoading={updatingId === ambulance.id} onClick={() => setStatus(ambulance, "AVAILABLE")}>
                Set available
              </Button>
            )}
            {ambulance.status === "ON_TRIP" && <p className="text-xs text-zinc-500">Currently on a trip</p>}
          </div>
        </Card>
      ))}
    </div>
  );
}

function DispatchList({
  dispatches,
  availableAmbulances,
  onUpdated,
}: {
  dispatches: AmbulanceRequestItem[];
  availableAmbulances: Ambulance[];
  onUpdated: (d: AmbulanceRequestItem) => void;
}) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const assign = async (dispatch: AmbulanceRequestItem, ambulanceId: string) => {
    if (!ambulanceId) return;
    setUpdatingId(dispatch.id);
    try {
      const updated = await ambulanceRequestsApi.update(dispatch.id, { ambulanceId });
      onUpdated(updated);
    } catch {
      // ignore; list will simply not reflect the change
    } finally {
      setUpdatingId(null);
    }
  };

  const advance = async (dispatch: AmbulanceRequestItem, status: AmbulanceRequestStatus) => {
    setUpdatingId(dispatch.id);
    try {
      const updated = await ambulanceRequestsApi.update(dispatch.id, { status });
      onUpdated(updated);
    } catch {
      // ignore
    } finally {
      setUpdatingId(null);
    }
  };

  if (dispatches.length === 0) {
    return <p className="text-sm text-zinc-500">No ambulance dispatches yet.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {dispatches.map((dispatch) => {
        const isTerminal = TERMINAL.includes(dispatch.status);
        const next = NEXT_STATUS[dispatch.status];
        return (
          <Card key={dispatch.id} className="flex flex-col gap-2">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium text-zinc-900">{dispatch.pickupAddress}</p>
                <p className="text-xs text-zinc-500">→ {dispatch.dropoffAddress}</p>
              </div>
              <AmbulanceRequestStatusBadge status={dispatch.status} />
            </div>

            {dispatch.ambulance ? (
              <p className="text-sm text-zinc-600">
                {dispatch.ambulance.vehicleNumber} · {dispatch.ambulance.driverName}
              </p>
            ) : (
              !isTerminal && (
                <Select
                  value=""
                  onChange={(e) => assign(dispatch, e.target.value)}
                  disabled={updatingId === dispatch.id || availableAmbulances.length === 0}
                >
                  <option value="">
                    {availableAmbulances.length === 0 ? "No ambulances available" : "Assign an ambulance…"}
                  </option>
                  {availableAmbulances.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.vehicleNumber} · {a.driverName}
                    </option>
                  ))}
                </Select>
              )
            )}

            <p className="text-xs text-zinc-400">Requested {new Date(dispatch.createdAt).toLocaleString()}</p>

            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Link href={`/ambulance/${dispatch.id}`} className="text-sm font-medium text-red-600 hover:underline">
                View details
              </Link>
              {!isTerminal && next && (
                <Button size="sm" isLoading={updatingId === dispatch.id} onClick={() => advance(dispatch, next.status)}>
                  {next.label}
                </Button>
              )}
              {!isTerminal && (
                <Button
                  size="sm"
                  variant="ghost"
                  isLoading={updatingId === dispatch.id}
                  onClick={() => advance(dispatch, "CANCELLED")}
                >
                  Cancel
                </Button>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function AmbulanceFleetPage() {
  const [ambulances, setAmbulances] = useState<Ambulance[] | null>(null);
  const [dispatches, setDispatches] = useState<AmbulanceRequestItem[] | null>(null);

  useEffect(() => {
    ambulancesApi.list().then(setAmbulances).catch(() => setAmbulances([]));
    ambulanceRequestsApi.list().then(setDispatches).catch(() => setDispatches([]));
  }, []);

  const upsertAmbulance = (ambulance: Ambulance) =>
    setAmbulances((prev) => {
      if (!prev) return [ambulance];
      const exists = prev.some((a) => a.id === ambulance.id);
      return exists ? prev.map((a) => (a.id === ambulance.id ? ambulance : a)) : [ambulance, ...prev];
    });

  const upsertDispatch = (dispatch: AmbulanceRequestItem) =>
    setDispatches((prev) => (prev ? prev.map((d) => (d.id === dispatch.id ? dispatch : d)) : prev));

  const availableAmbulances = (ambulances ?? []).filter((a) => a.status === "AVAILABLE");

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <PageHeader
        icon={AmbulanceIcon}
        title="Ambulance fleet"
        subtitle="Register vehicles and dispatch them for faster patient and donor transportation."
      />

      <div className="mt-6">
        <RegisterAmbulanceForm onCreated={upsertAmbulance} />
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-bold text-zinc-900">Your fleet</h2>
        <div className="mt-4">
          {ambulances === null ? <Spinner /> : <FleetList ambulances={ambulances} onUpdated={upsertAmbulance} />}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-bold text-zinc-900">Dispatch requests</h2>
        <div className="mt-4">
          {dispatches === null ? (
            <Spinner />
          ) : (
            <DispatchList dispatches={dispatches} availableAmbulances={availableAmbulances} onUpdated={upsertDispatch} />
          )}
        </div>
      </div>
    </div>
  );
}

export default function AmbulancesPage() {
  return (
    <ProtectedRoute roles={["HOSPITAL", "BLOOD_BANK"]}>
      <AmbulanceFleetPage />
    </ProtectedRoute>
  );
}
