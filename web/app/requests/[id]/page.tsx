"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { ApiError, requestsApi } from "@/lib/api";
import type { RequestDetail, RequestResponseItem, ResponseStatus } from "@/lib/types";
import { BloodGroupBadge, RequestStatusBadge, ResponseStatusBadge, UrgencyBadge } from "@/components/badges";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { MapView } from "@/components/MapViewLazy";

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

      <Card className="mt-4">
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

        <p className="mt-4 text-xs text-zinc-400">
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
