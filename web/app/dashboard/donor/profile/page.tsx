"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { ApiError, donorsApi } from "@/lib/api";
import { BLOOD_GROUPS, INDIAN_STATES } from "@/lib/constants";
import type { BloodGroupLabel } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";
import { LocateButton } from "@/components/LocateButton";
import { Spinner } from "@/components/ui/Spinner";

function DonorProfileForm() {
  const { donor, refresh } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: donor?.fullName ?? "",
    phone: donor?.phone ?? "",
    bloodGroup: (donor?.bloodGroup ?? "") as BloodGroupLabel | "",
    weightKg: donor ? String(donor.weightKg) : "",
    address: donor?.address ?? "",
    city: donor?.city ?? "",
    state: donor?.state ?? "",
    pincode: donor?.pincode ?? "",
    medicalNotes: donor?.medicalNotes ?? "",
  });
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    donor ? { lat: donor.lat, lng: donor.lng } : null
  );
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!donor) return <Spinner />;

  const update = (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setIsSubmitting(true);
    try {
      await donorsApi.updateMe({
        fullName: form.fullName,
        phone: form.phone,
        bloodGroup: form.bloodGroup || undefined,
        weightKg: form.weightKg ? Number(form.weightKg) : undefined,
        address: form.address,
        city: form.city,
        state: form.state,
        pincode: form.pincode,
        medicalNotes: form.medicalNotes || null,
        lat: coords?.lat,
        lng: coords?.lng,
      });
      await refresh();
      setSuccess(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900">Edit your profile</h1>
        <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/donor")}>
          Back to dashboard
        </Button>
      </div>
      <p className="mt-1 text-sm text-zinc-500">Keep your details up to date so hospitals can reach you quickly.</p>

      <Card className="mt-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Full name" required value={form.fullName} onChange={update("fullName")} />
            <Input label="Phone" required value={form.phone} onChange={update("phone")} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Blood group" required value={form.bloodGroup} onChange={update("bloodGroup")}>
              {BLOOD_GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </Select>
            <Input
              label="Weight (kg)"
              type="number"
              min={1}
              max={400}
              required
              value={form.weightKg}
              onChange={update("weightKg")}
            />
          </div>

          <Input label="Address" required value={form.address} onChange={update("address")} />
          <div className="grid gap-4 sm:grid-cols-3">
            <Input label="City" required value={form.city} onChange={update("city")} />
            <Select label="State" required value={form.state} onChange={update("state")}>
              {INDIAN_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
            <Input label="Pincode" required value={form.pincode} onChange={update("pincode")} />
          </div>

          <Textarea
            label="Medical notes (optional)"
            rows={3}
            maxLength={1000}
            value={form.medicalNotes ?? ""}
            onChange={update("medicalNotes")}
          />

          <div>
            <LocateButton onLocate={setCoords} />
            {coords && (
              <p className="mt-1 text-xs text-green-600">
                Location set ({coords.lat.toFixed(4)}, {coords.lng.toFixed(4)})
              </p>
            )}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-600">Profile updated.</p>}
          <Button type="submit" isLoading={isSubmitting} className="w-full">
            Save changes
          </Button>
        </form>
      </Card>
    </div>
  );
}

export default function DonorProfilePage() {
  return (
    <ProtectedRoute roles={["DONOR"]}>
      <DonorProfileForm />
    </ProtectedRoute>
  );
}
