"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Ambulance as AmbulanceIcon, ArrowRight, Boxes, ClipboardList, Users } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { requestsApi } from "@/lib/api";
import type { EmergencyRequest } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { RequestCard } from "@/components/RequestCard";
import { PageHeader } from "@/components/PageHeader";

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

  const actions = [
    ...(user?.role === "BLOOD_BANK"
      ? [{ href: "/dashboard/organization/inventory", label: "Manage inventory", icon: Boxes }]
      : []),
    { href: "/dashboard/organization/donors", label: "Find donors", icon: Users },
    { href: "/dashboard/organization/ambulances", label: "Ambulance fleet", icon: AmbulanceIcon },
    { href: "/requests", label: "All requests", icon: ClipboardList },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <PageHeader
        icon={AmbulanceIcon}
        title={organization.name}
        subtitle={
          <>
            <p>
              {organization.type === "BLOOD_BANK" ? "Blood Bank" : "Hospital"} · {organization.city}
            </p>
            <p className="mt-1">
              {organization.isVerified ? (
                <span className="font-medium text-green-600">Verified</span>
              ) : (
                <span className="font-medium text-orange-600">
                  Pending verification — you can still post requests while an admin reviews your account.
                </span>
              )}
            </p>
          </>
        }
        actions={
          <Link href="/dashboard/organization/requests/new">
            <Button>New emergency request</Button>
          </Link>
        }
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {actions.map((a) => {
          const Icon = a.icon;
          return (
            <Link
              key={a.href}
              href={a.href}
              className="rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
            >
              <Card className="group flex h-full items-center gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lifted">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-sm font-semibold text-zinc-900">{a.label}</span>
                <ArrowRight className="ml-auto h-4 w-4 text-zinc-300 transition-colors group-hover:text-red-500" />
              </Card>
            </Link>
          );
        })}
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
