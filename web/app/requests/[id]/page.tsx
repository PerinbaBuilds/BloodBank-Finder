"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { ApiError, ambulanceRequestsApi, ambulancesApi, requestsApi } from "@/lib/api";
import type {
  Ambulance,
  AmbulanceRequestItem,
  RequestDetail,
  RequestResponseItem,
  ResponseStatus,
} from "@/lib/types";
import {
  AmbulanceRequestStatusBadge,
  BloodGroupBadge,
  RequestStatusBadge,
  ResponseStatusBadge,
  UrgencyBadge,
} from "@/components/badges";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Spinner } from "@/components/ui/Spinner";
import { MapView } from "@/components/MapViewLazy";
import { LocationField } from "@/components/LocationField";

function ResponseRow({
  response,
  isOwningOrg,
  isMine,
  onUpdate,
}: {
  response: RequestResponseItem;
  isOwningOrg: boolean;
  isMine: boolean;
  onUpdate: (responseId: string, status: ResponseStatus) => Promise<void>;
}) {
  const [isUpdating, setIsUpdating] = useState(false);
  const act = async (status: ResponseStatus) => {
    setIsUpdating(true);
    try {
      await onUpdate(response.id, status);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <p className="font-medium text-zinc-900">{response.donor?.fullName ?? "Donor"}</p>
          {response.donor && <BloodGroupBadge group={response.donor.bloodGroup} />}
        </div>
        <p className="text-xs text-zinc-500">
          ~{response.distanceKm} km away · Responded {new Date(response.respondedAt).toLocaleString()}
          {response.donor?.phone && ` · ${response.donor.phone}`}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <ResponseStatusBadge status={response.status} />
        {isOwningOrg && response.status === "OFFERED" && (
          <>
            <Button size="sm" isLoading={isUpdating} onClick={() => act("CONFIRMED")}>
              Confirm
            </Button>
            <Button size="sm" variant="outline" isLoading={isUpdating} onClick={() => act("DECLINED")}>
              Decline
            </Button>
          </>
        )}
        {isOwningOrg && response.status === "CONFIRMED" && (
          <Button size="sm" isLoading={isUpdating} onClick={() => act("COMPLETED")}>
            Mark completed
          </Button>
        )}
        {isMine && (response.status === "OFFERED" || response.status === "CONFIRMED") && (
          <Button size="sm" variant="ghost" isLoading={isUpdating} onClick={() => act("CANCELLED")}>
            Cancel
          </Button>
        )}
      </div>
    </Card>
  );
}

function AmbulanceDispatchSection({ request }: { request: RequestDetail }) {
  const router = useRouter();
  const [dispatches, setDispatches] = useState<AmbulanceRequestItem[] | null>(null);
  const [availableAmbulances, setAvailableAmbulances] = useState<Ambulance[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ pickupAddress: request.address, responseId: "", ambulanceId: "", notes: "" });
  const [coords, setCoords] = useState({ lat: request.lat, lng: request.lng });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    ambulanceRequestsApi
      .list()
      .then((all) => setDispatches(all.filter((d) => d.emergencyRequestId === request.id)))
      .catch(() => setDispatches([]));
    ambulancesApi
      .list()
      .then((all) => setAvailableAmbulances(all.filter((a) => a.status === "AVAILABLE")))
      .catch(() => setAvailableAmbulances([]));
  }, [request.id]);

  const confirmedResponses = request.responses.filter((r) => r.status === "CONFIRMED");

  const updateField = (key: "pickupAddress" | "notes") => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const created = await ambulanceRequestsApi.create({
        emergencyRequestId: request.id,
        pickupAddress: form.pickupAddress,
        pickupLat: coords.lat,
        pickupLng: coords.lng,
        responseId: form.responseId || undefined,
        ambulanceId: form.ambulanceId || undefined,
        notes: form.notes || undefined,
      });
      router.push(`/ambulance/${created.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not request an ambulance.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-zinc-900">Ambulance dispatches</h2>
        <Button size="sm" variant="outline" onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Cancel" : "Request ambulance"}
        </Button>
      </div>

      {dispatches === null ? (
        <div className="mt-4">
          <Spinner />
        </div>
      ) : dispatches.length > 0 ? (
        <div className="mt-4 flex flex-col gap-2">
          {dispatches.map((d) => (
            <Link key={d.id} href={`/ambulance/${d.id}`}>
              <Card className="flex flex-wrap items-center justify-between gap-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lifted">
                <p className="text-sm text-zinc-700">
                  {d.pickupAddress} → {d.dropoffAddress}
                </p>
                <AmbulanceRequestStatusBadge status={d.status} />
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        !showForm && <p className="mt-4 text-sm text-zinc-500">No ambulance dispatched for this request yet.</p>
      )}

      {showForm && (
        <Card className="mt-4">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input label="Pickup address" required value={form.pickupAddress} onChange={updateField("pickupAddress")} />
            <div>
              <LocationField onLocate={setCoords} />
              <p className="mt-1 text-xs text-zinc-500">
                Pickup coordinates: {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Donor (optional)"
                value={form.responseId}
                onChange={(e) => setForm((prev) => ({ ...prev, responseId: e.target.value }))}
              >
                <option value="">No specific donor</option>
                {confirmedResponses.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.donor?.fullName ?? "Donor"}
                  </option>
                ))}
              </Select>
              <Select
                label="Ambulance (optional)"
                value={form.ambulanceId}
                onChange={(e) => setForm((prev) => ({ ...prev, ambulanceId: e.target.value }))}
              >
                <option value="">{availableAmbulances.length === 0 ? "No ambulances available" : "Assign later"}</option>
                {availableAmbulances.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.vehicleNumber} · {a.driverName}
                  </option>
                ))}
              </Select>
            </div>
            <Input label="Notes (optional)" value={form.notes} onChange={updateField("notes")} />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" isLoading={isSubmitting} className="self-start">
              Confirm dispatch
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}

function RequestDetailView() {
  const { id } = useParams<{ id: string }>();
  const { user, organization } = useAuth();
  const { socket } = useSocket();
  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [isResponding, setIsResponding] = useState(false);
  const [isUpdatingRequest, setIsUpdatingRequest] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await requestsApi.get(id);
      setRequest(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load this request.");
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount/id-change is intentional
    load();
  }, [load]);

  useEffect(() => {
    if (!socket) return;
    const refresh = () => load();
    socket.on("request:updated", refresh);
    socket.on("response:new", refresh);
    socket.on("response:updated", refresh);
    return () => {
      socket.off("request:updated", refresh);
      socket.off("response:new", refresh);
      socket.off("response:updated", refresh);
    };
  }, [socket, load]);

  if (error) return <p className="mx-auto max-w-2xl px-4 py-12 text-sm text-red-600">{error}</p>;
  if (!request) return <Spinner />;

  const isOwningOrg = organization?.id === request.organizationId;
  const myResponse = request.responses.find((r) => r.donorUserId === user?.id);
  const canRespond =
    user?.role === "DONOR" && !myResponse && (request.status === "OPEN" || request.status === "PARTIALLY_FULFILLED");
  const canManageRequest = isOwningOrg && (request.status === "OPEN" || request.status === "PARTIALLY_FULFILLED");

  const handleRespond = async () => {
    setActionError("");
    setIsResponding(true);
    try {
      await requestsApi.respond(request.id);
      await load();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Could not submit your offer.");
    } finally {
      setIsResponding(false);
    }
  };

  const handleUpdateResponse = async (responseId: string, status: ResponseStatus) => {
    setActionError("");
    try {
      await requestsApi.updateResponse(request.id, responseId, status);
      await load();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Could not update this response.");
    }
  };

  const handleUpdateRequestStatus = async (status: "CANCELLED" | "FULFILLED") => {
    setActionError("");
    setIsUpdatingRequest(true);
    try {
      await requestsApi.update(request.id, { status });
      await load();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Could not update this request.");
    } finally {
      setIsUpdatingRequest(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/requests" className="text-sm font-medium text-red-600 hover:underline">
        ← Back to requests
      </Link>

      <Card className="mt-4 shadow-lifted">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-zinc-900">
              {request.organization?.name ?? "Organization"} needs {request.bloodGroup} blood
            </h1>
            <p className="mt-1 text-sm text-zinc-500">{request.address}</p>
          </div>
          <BloodGroupBadge group={request.bloodGroup} />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <UrgencyBadge urgency={request.urgency} />
          <RequestStatusBadge status={request.status} />
          <span className="text-sm text-zinc-600">
            {request.unitsFulfilled}/{request.unitsNeeded} units fulfilled
          </span>
        </div>

        {request.patientInfo && (
          <p className="mt-4 text-sm text-zinc-700">
            <span className="font-medium">Patient info: </span>
            {request.patientInfo}
          </p>
        )}
        {request.notes && (
          <p className="mt-2 text-sm text-zinc-700">
            <span className="font-medium">Notes: </span>
            {request.notes}
          </p>
        )}

        <p className="mt-4 text-xs text-zinc-500">
          Posted {new Date(request.createdAt).toLocaleString()} · Expires{" "}
          {new Date(request.expiresAt).toLocaleString()}
        </p>

        {actionError && <p className="mt-3 text-sm text-red-600">{actionError}</p>}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {canRespond && (
            <Button isLoading={isResponding} onClick={handleRespond}>
              Offer to donate
            </Button>
          )}
          {myResponse && <p className="text-sm text-zinc-600">Your offer status: {myResponse.status}</p>}
          {canManageRequest && (
            <>
              <Button
                variant="outline"
                isLoading={isUpdatingRequest}
                onClick={() => handleUpdateRequestStatus("FULFILLED")}
              >
                Mark fulfilled
              </Button>
              <Button
                variant="ghost"
                isLoading={isUpdatingRequest}
                onClick={() => handleUpdateRequestStatus("CANCELLED")}
              >
                Cancel request
              </Button>
            </>
          )}
          {!canRespond && !myResponse && !canManageRequest && (
            <p className="text-sm text-zinc-500">
              {user?.role === "DONOR"
                ? "You're not eligible to respond to this request right now (blood group, availability, or donation interval)."
                : isOwningOrg
                ? "This request is closed and can no longer be managed."
                : `Only ${request.organization?.name ?? "the requesting organization"} and compatible donors can act on this request.`}
            </p>
          )}
        </div>
      </Card>

      <div className="mt-4">
        <MapView
          center={[request.lat, request.lng]}
          markers={[
            {
              id: request.id,
              lat: request.lat,
              lng: request.lng,
              label: request.organization?.name ?? "Request location",
            },
          ]}
          height="280px"
        />
      </div>

      {isOwningOrg && (
        <div className="mt-8">
          <h2 className="text-lg font-bold text-zinc-900">Donor responses ({request.responses.length})</h2>
          <div className="mt-4 flex flex-col gap-3">
            {request.responses.length === 0 ? (
              <p className="text-sm text-zinc-500">No donors have responded yet.</p>
            ) : (
              request.responses.map((response) => (
                <ResponseRow
                  key={response.id}
                  response={response}
                  isOwningOrg={isOwningOrg}
                  isMine={response.donorUserId === user?.id}
                  onUpdate={handleUpdateResponse}
                />
              ))
            )}
          </div>
        </div>
      )}

      {isOwningOrg && <AmbulanceDispatchSection request={request} />}

      {myResponse && !isOwningOrg && (
        <div className="mt-8">
          <h2 className="text-lg font-bold text-zinc-900">Your offer</h2>
          <div className="mt-4">
            <ResponseRow response={myResponse} isOwningOrg={false} isMine={true} onUpdate={handleUpdateResponse} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function RequestDetailPage() {
  return (
    <ProtectedRoute>
      <RequestDetailView />
    </ProtectedRoute>
  );
}
