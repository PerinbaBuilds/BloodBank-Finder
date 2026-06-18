"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";
import { BLOOD_GROUPS, INDIAN_STATES } from "@/lib/constants";
import type { BloodGroupLabel, Gender } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";
import { LocateButton } from "@/components/LocateButton";

export default function DonorRegisterPage() {
  const { registerDonor } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    password: "",
    phone: "",
    fullName: "",
    bloodGroup: "" as BloodGroupLabel | "",
    gender: "" as Gender | "",
    dateOfBirth: "",
    weightKg: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!coords) {
      setError("Please set your location so nearby hospitals can find you.");
      return;
    }
    if (!form.bloodGroup || !form.gender) {
      setError("Please select your blood group and gender.");
      return;
    }
    setIsSubmitting(true);
    try {
      await registerDonor({
        email: form.email,
        password: form.password,
        phone: form.phone,
        fullName: form.fullName,
        bloodGroup: form.bloodGroup,
        gender: form.gender,
        dateOfBirth: form.dateOfBirth,
        weightKg: Number(form.weightKg),
        lat: coords.lat,
        lng: coords.lng,
        address: form.address,
        city: form.city,
        state: form.state,
        pincode: form.pincode,
      });
      router.push("/dashboard/donor");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold text-zinc-900">Register as a Donor</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Join our network of voluntary donors and help save lives in your community.
      </p>

      <Card className="mt-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Full name" required value={form.fullName} onChange={update("fullName")} />
            <Input label="Phone" required value={form.phone} onChange={update("phone")} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Email"
              type="email"
              required
              value={form.email}
              onChange={update("email")}
              autoComplete="email"
            />
            <Input
              label="Password"
              type="password"
              required
              minLength={8}
              hint="At least 8 characters"
              value={form.password}
              onChange={update("password")}
              autoComplete="new-password"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Select label="Blood group" required value={form.bloodGroup} onChange={update("bloodGroup")}>
              <option value="">Select</option>
              {BLOOD_GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </Select>
            <Select label="Gender" required value={form.gender} onChange={update("gender")}>
              <option value="">Select</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
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
          <Input label="Date of birth" type="date" required value={form.dateOfBirth} onChange={update("dateOfBirth")} />

          <Input label="Address" required value={form.address} onChange={update("address")} />
          <div className="grid gap-4 sm:grid-cols-3">
            <Input label="City" required value={form.city} onChange={update("city")} />
            <Select label="State" required value={form.state} onChange={update("state")}>
              <option value="">Select</option>
              {INDIAN_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
            <Input label="Pincode" required value={form.pincode} onChange={update("pincode")} />
          </div>

          <div>
            <LocateButton onLocate={setCoords} />
            {coords && (
              <p className="mt-1 text-xs text-green-600">
                Location set ({coords.lat.toFixed(4)}, {coords.lng.toFixed(4)})
              </p>
            )}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" isLoading={isSubmitting} className="w-full">
            Create donor account
          </Button>
        </form>
      </Card>
    </div>
  );
}
