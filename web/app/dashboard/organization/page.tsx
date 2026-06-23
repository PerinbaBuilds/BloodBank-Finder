"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { requestsApi } from "@/lib/api";
import type { EmergencyRequest } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { RequestCard } from "@/components/RequestCard";

function OrganizationDashboard() {
  const { organization, user } = useAuth();
  const [requests, setRequests] = useState<EmergencyRequest[] | null>(null);

  useEffect(() => {
    requestsApi
      .list({ mine: true })
      .then(setRequests)
      .catch(() => setRequests([]));
  }, []);

  if (!organization) return <Spinner />;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">{organization.name}</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {organization.type === "BLOOD_BANK" ? "Blood Bank" : "Hospital"} · {organization.city}
          </p>
          <p className="mt-1 text-sm">
            {organization.isVerified ? (
              <span className="font-medium text-green-600">Verified</span>
            ) : (
              <span className="font-medium text-orange-600">
                Pending verification — you can still post requests while an admin reviews your account.
              </span>
            )}
          </p>
        </div>
        <Link href="/dashboard/organization/requests/new">
          <Button>New emergency request</Button>
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {user?.role === "BLOOD_BANK" && (
          <Link href="/dashboard/organization/inventory">
            <Button variant="outline" size="sm">
              Manage inventory
            </Button>
          </Link>
        )}
        <Link href="/dashboard/organization/donors">
          <Button variant="outline" size="sm">
            Find donors
          </Button>
        </Link>
        <Link href="/requests">
          <Button variant="outline" size="sm">
            All requests
          </Button>
        </Link>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-bold text-zinc-900">Your recent requests</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {requests === null ? (
            <div className="sm:col-span-2">
              <Spinner />
            </div>
          ) : requests.length === 0 ? (
            <Card className="sm:col-span-2">
              <p className="text-sm text-zinc-500">
                You haven&apos;t posted any emergency requests yet.{" "}
                <Link
                  href="/dashboard/organization/requests/new"
                  className="font-medium text-red-600 hover:underline"
                >
                  Create one
                </Link>
                .
              </p>
            </Card>
          ) : (
            requests.slice(0, 6).map((request) => <RequestCard key={request.id} request={request} />)
          )}
        </div>
      </div>
    </div>
  );
}

export default function OrganizationDashboardPage() {
  return (
    <ProtectedRoute roles={["HOSPITAL", "BLOOD_BANK"]}>
      <OrganizationDashboard />
    </ProtectedRoute>
  );
}
