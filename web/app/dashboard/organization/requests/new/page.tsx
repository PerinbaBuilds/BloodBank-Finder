"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ApiError, requestsApi } from "@/lib/api";
import { BLOOD_GROUPS } from "@/lib/constants";
import type { BloodGroupLabel, Urgency } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";
import { LocationField } from "@/components/LocationField";

function NewRequestForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedGroup = searchParams.get("bloodGroup");
  const prefilledGroup = (BLOOD_GROUPS as readonly string[]).includes(requestedGroup ?? "")
    ? (requestedGroup as BloodGroupLabel)
    : "";
  const [form, setForm] = useState({
    bloodGroup: prefilledGroup as BloodGroupLabel | "",
    unitsNeeded: "1",
    urgency: "" as Urgency | "",
    patientInfo: "",
    notes: "",
    address: "",
    expiresInHours: "24",
  });
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const update = (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.bloodGroup || !form.urgency) {
      setError("Please select a blood group and urgency level.");
      return;
    }
    setIsSubmitting(true);
    try {
      const { request } = await requestsApi.create({
        bloodGroup: form.bloodGroup,
        unitsNeeded: Number(form.unitsNeeded),
        urgency: form.urgency,
        patientInfo: form.patientInfo || undefined,
        notes: form.notes || undefined,
        address: form.address || undefined,
        lat: coords?.lat,
        lng: coords?.lng,
        expiresInHours: Number(form.expiresInHours),
      });
      router.push(`/requests/${request.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold text-zinc-900">Post an emergency blood request</h1>
      <p className="mt-1 text-sm text-zinc-500">Compatible donors near your location will be notified instantly.</p>

      <Card className="mt-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Select label="Blood group needed" required value={form.bloodGroup} onChange={update("bloodGroup")}>
              <option value="">Select</option>
              {BLOOD_GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </Select>
            <Input
              label="Units needed"
              type="number"
              min={1}
              max={50}
              required
              value={form.unitsNeeded}
              onChange={update("unitsNeeded")}
            />
            <Select label="Urgency" required value={form.urgency} onChange={update("urgency")}>
              <option value="">Select</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MODERATE">Moderate</option>
            </Select>
          </div>

          <Textarea
            label="Patient info (optional)"
            rows={2}
            maxLength={500}
            value={form.patientInfo}
            onChange={update("patientInfo")}
          />
          <Textarea
            label="Notes for donors (optional)"
            rows={2}
            maxLength={1000}
            value={form.notes}
            onChange={update("notes")}
          />

          <Input
            label="Address (optional)"
            hint="Leave blank to use your organization's registered address"
            value={form.address}
            onChange={update("address")}
          />

          <div>
            <LocationField onLocate={setCoords} />
            <p className={`mt-1 text-xs ${coords ? "text-green-600" : "text-zinc-500"}`}>
              {coords
                ? `Location set (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`
                : "Leave unset to use your organization's registered location."}
            </p>
          </div>

          <Select label="Expires in" value={form.expiresInHours} onChange={update("expiresInHours")}>
            <option value="6">6 hours</option>
            <option value="12">12 hours</option>
            <option value="24">24 hours</option>
            <option value="48">48 hours</option>
            <option value="72">72 hours</option>
          </Select>

          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" isLoading={isSubmitting} className="w-full">
            Post request
          </Button>
        </form>
      </Card>
    </div>
  );
}

export default function NewRequestPage() {
  return (
    <ProtectedRoute roles={["HOSPITAL", "BLOOD_BANK"]}>
      <Suspense>
        <NewRequestForm />
      </Suspense>
    </ProtectedRoute>
  );
}
