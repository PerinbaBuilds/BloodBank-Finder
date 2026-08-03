"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Droplet } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";
import { BLOOD_GROUPS, INDIAN_STATES } from "@/lib/constants";
import type { BloodGroupLabel, Gender } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";
import { Toggle } from "@/components/ui/Toggle";
import { LocationField } from "@/components/LocationField";

const MIN_DONOR_AGE = 18;
const MAX_DONOR_AGE = 65;

function isoDateYearsAgo(years: number) {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  return d.toISOString().split("T")[0];
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-zinc-100 pt-6 first:border-t-0 first:pt-0">
      <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
      {description && <p className="mt-0.5 text-xs text-zinc-500">{description}</p>}
      <div className="mt-4 flex flex-col gap-4">{children}</div>
    </section>
  );
}

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
    heightCm: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    isSmoker: false,
    isAlcoholic: false,
    usesDrugs: false,
    hasChronicIllness: false,
    chronicIllnessDetails: "",
    hasGeneticDisorder: false,
    geneticDisorderDetails: "",
    hasDonatedBefore: false,
    lastDonationDate: "",
    hadTransfusion: false,
    transfusionDate: "",
  });
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const update =
    (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const toggle = (key: keyof typeof form) => (value: boolean) => setForm((prev) => ({ ...prev, [key]: value }));

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
        heightCm: Number(form.heightCm),
        lat: coords.lat,
        lng: coords.lng,
        address: form.address,
        city: form.city,
        state: form.state,
        pincode: form.pincode,
        isSmoker: form.isSmoker,
        isAlcoholic: form.isAlcoholic,
        usesDrugs: form.usesDrugs,
        hasChronicIllness: form.hasChronicIllness,
        chronicIllnessDetails: form.hasChronicIllness ? form.chronicIllnessDetails || undefined : undefined,
        hasGeneticDisorder: form.hasGeneticDisorder,
        geneticDisorderDetails: form.hasGeneticDisorder ? form.geneticDisorderDetails || undefined : undefined,
        lastDonationDate: form.hasDonatedBefore ? form.lastDonationDate || undefined : undefined,
        hadTransfusion: form.hadTransfusion,
        transfusionDate: form.hadTransfusion ? form.transfusionDate || undefined : undefined,
      });
      router.push("/dashboard/donor");
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
          <Droplet className="h-3.5 w-3.5" /> Become a donor
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-zinc-900">Create your donor account</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">
          Join the network of voluntary donors and get alerted the moment someone nearby needs your blood type.
        </p>
      </div>

      <Card className="mt-8 animate-fade-in-up sm:p-7">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <FormSection title="Account">
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
          </FormSection>

          <FormSection title="About you">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Full name"
                required
                value={form.fullName}
                onChange={update("fullName")}
                autoComplete="name"
              />
              <Input label="Phone" type="tel" required value={form.phone} onChange={update("phone")} autoComplete="tel" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
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
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Weight (kg)"
                type="number"
                min={1}
                max={400}
                required
                value={form.weightKg}
                onChange={update("weightKg")}
              />
              <Input
                label="Height (cm)"
                type="number"
                min={1}
                max={300}
                required
                value={form.heightCm}
                onChange={update("heightCm")}
              />
            </div>
            <Input
              label="Date of birth"
              type="date"
              required
              min={isoDateYearsAgo(MAX_DONOR_AGE)}
              max={isoDateYearsAgo(MIN_DONOR_AGE)}
              value={form.dateOfBirth}
              onChange={update("dateOfBirth")}
            />
          </FormSection>

          <FormSection title="Where you're located" description="So nearby hospitals and blood banks can reach you fast.">
            <Input
              label="Address"
              required
              value={form.address}
              onChange={update("address")}
              autoComplete="street-address"
            />
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
              <Input
                label="Pincode"
                required
                value={form.pincode}
                onChange={update("pincode")}
                autoComplete="postal-code"
              />
            </div>
            <div>
              <LocationField onLocate={setCoords} />
              {coords && (
                <p className="mt-1 text-xs text-green-600">
                  Location set ({coords.lat.toFixed(4)}, {coords.lng.toFixed(4)})
                </p>
              )}
            </div>
          </FormSection>

          <FormSection
            title="Health & lifestyle"
            description="Helps hospitals and blood banks assess donation eligibility. Kept private to your profile."
          >
            <div className="flex flex-col divide-y divide-zinc-100 rounded-xl border border-zinc-200 px-4">
              <Toggle label="Do you smoke?" checked={form.isSmoker} onChange={toggle("isSmoker")} />
              <Toggle label="Do you consume alcohol?" checked={form.isAlcoholic} onChange={toggle("isAlcoholic")} />
              <Toggle label="Do you use recreational drugs?" checked={form.usesDrugs} onChange={toggle("usesDrugs")} />
              <Toggle
                label="Do you have any chronic illness?"
                checked={form.hasChronicIllness}
                onChange={toggle("hasChronicIllness")}
              />
              {form.hasChronicIllness && (
                <div className="animate-fade-in-up py-3">
                  <Textarea
                    label="Please describe the illness"
                    rows={2}
                    maxLength={500}
                    value={form.chronicIllnessDetails}
                    onChange={update("chronicIllnessDetails")}
                  />
                </div>
              )}
              <Toggle
                label="Any known genetic disorder?"
                checked={form.hasGeneticDisorder}
                onChange={toggle("hasGeneticDisorder")}
              />
              {form.hasGeneticDisorder && (
                <div className="animate-fade-in-up py-3">
                  <Textarea
                    label="Please describe the disorder"
                    rows={2}
                    maxLength={500}
                    value={form.geneticDisorderDetails}
                    onChange={update("geneticDisorderDetails")}
                  />
                </div>
              )}
              <Toggle
                label="Have you donated blood before?"
                checked={form.hasDonatedBefore}
                onChange={toggle("hasDonatedBefore")}
              />
              {form.hasDonatedBefore && (
                <div className="animate-fade-in-up py-3">
                  <Input
                    label="When was your last donation?"
                    type="date"
                    max={isoDateYearsAgo(0)}
                    value={form.lastDonationDate}
                    onChange={update("lastDonationDate")}
                  />
                </div>
              )}
              <Toggle
                label="Any blood transfusions before?"
                checked={form.hadTransfusion}
                onChange={toggle("hadTransfusion")}
              />
              {form.hadTransfusion && (
                <div className="animate-fade-in-up py-3">
                  <Input
                    label="When was the transfusion?"
                    type="date"
                    max={isoDateYearsAgo(0)}
                    value={form.transfusionDate}
                    onChange={update("transfusionDate")}
                  />
                </div>
              )}
            </div>
          </FormSection>

          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
          <Button type="submit" isLoading={isSubmitting} className="w-full">
            Create donor account
          </Button>
        </form>
      </Card>
    </div>
  );
}
