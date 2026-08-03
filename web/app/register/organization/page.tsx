"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";
import { INDIAN_STATES } from "@/lib/constants";
import type { OrgType } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";
import { LocationField } from "@/components/LocationField";

export default function OrganizationRegisterPage() {
  const { registerOrganization } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    password: "",
    phone: "",
    name: "",
    type: "" as OrgType | "",
    regNumber: "",
    contactPerson: "",
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
      setError("Please set your organization's location.");
      return;
    }
    if (!form.type) {
      setError("Please select an organization type.");
      return;
    }
    setIsSubmitting(true);
    try {
      await registerOrganization({
        email: form.email,
        password: form.password,
        phone: form.phone,
        name: form.name,
        type: form.type,
        regNumber: form.regNumber,
        contactPerson: form.contactPerson,
        lat: coords.lat,
        lng: coords.lng,
        address: form.address,
        city: form.city,
        state: form.state,
        pincode: form.pincode,
      });
      router.push("/dashboard/organization");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-14">
      <div className="animate-fade-in-up text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-red-100 bg-white/80 px-3 py-1 text-xs font-semibold text-red-700 shadow-soft">
          <Building2 className="h-3.5 w-3.5" /> For hospitals &amp; blood banks
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-zinc-900">Register your organization</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">
          Post emergency requests, manage inventory, and reach compatible donors. Accounts are verified before going live.
        </p>
      </div>

      <Card className="mt-8 animate-fade-in-up sm:p-7">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Organization name" required value={form.name} onChange={update("name")} autoComplete="organization" />
            <Select label="Type" required value={form.type} onChange={update("type")}>
              <option value="">Select</option>
              <option value="HOSPITAL">Hospital</option>
              <option value="BLOOD_BANK">Blood Bank</option>
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Registration number" required value={form.regNumber} onChange={update("regNumber")} />
            <Input label="Contact person" required value={form.contactPerson} onChange={update("contactPerson")} autoComplete="name" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Phone" type="tel" required value={form.phone} onChange={update("phone")} autoComplete="tel" />
            <Input
              label="Email"
              type="email"
              required
              value={form.email}
              onChange={update("email")}
              autoComplete="email"
            />
          </div>
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

          <Input label="Address" required value={form.address} onChange={update("address")} autoComplete="street-address" />
          <div className="grid gap-4 sm:grid-cols-3">
            <Input label="City" required value={form.city} onChange={update("city")} autoComplete="address-level2" />
            <Select label="State" required value={form.state} onChange={update("state")} autoComplete="address-level1">
              <option value="">Select</option>
              {INDIAN_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
            <Input label="Pincode" required value={form.pincode} onChange={update("pincode")} autoComplete="postal-code" />
          </div>

          <div>
            <LocationField onLocate={setCoords} />
            {coords && (
              <p className="mt-1 text-xs text-green-600">
                Location set ({coords.lat.toFixed(4)}, {coords.lng.toFixed(4)})
              </p>
            )}
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
          <Button type="submit" isLoading={isSubmitting} className="w-full">
            Create organization account
          </Button>
          <p className="text-center text-xs text-zinc-500">
            New organizations start unverified. An administrator will verify your registration shortly.
          </p>
        </form>
      </Card>
    </div>
  );
}
