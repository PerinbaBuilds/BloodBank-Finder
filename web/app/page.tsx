"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Bell,
  Building2,
  CheckCircle2,
  Droplets,
  HeartPulse,
  MapPin,
  Search,
  SearchX,
  ShieldCheck,
  Siren,
  Users,
} from "lucide-react";
import { ApiError, organizationsApi, statsApi } from "@/lib/api";
import { BLOOD_GROUPS } from "@/lib/constants";
import type { BloodGroupLabel, OrgType, OrganizationWithInventory, StatsOverview } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";
import { OrgCard } from "@/components/OrgCard";
import { LocationField } from "@/components/LocationField";
import { MapView } from "@/components/MapViewLazy";

const INDIA_CENTER: [number, number] = [20.5937, 78.9629];
const RADIUS_OPTIONS = ["5", "10", "25", "50", "100"];

const STEPS = [
  {
    icon: Siren,
    title: "Post or search",
    body: "Hospitals and blood banks raise an emergency request in seconds. Anyone can search verified stock and organizations nearby.",
  },
  {
    icon: Bell,
    title: "Match instantly",
    body: "Every compatible, eligible donor in range is alerted at once — ranked by blood-type compatibility and live distance, over app, email, and SMS.",
  },
  {
    icon: HeartPulse,
    title: "Connect & donate",
    body: "Donors offer with one tap, get confirmed, and an ambulance can be dispatched — tracked live from request to donation.",
  },
];

export default function Home() {
  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [city, setCity] = useState("");
  const [type, setType] = useState<OrgType | "">("");
  const [bloodGroup, setBloodGroup] = useState<BloodGroupLabel | "">("");
  const [radiusKm, setRadiusKm] = useState("25");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [results, setResults] = useState<OrganizationWithInventory[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  useEffect(() => {
    statsApi.overview().then(setStats).catch(() => {});
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError("");
    setIsSearching(true);
    try {
      const data = await organizationsApi.search({
        type: type || undefined,
        bloodGroup: bloodGroup || undefined,
        city: city || undefined,
        lat: coords?.lat,
        lng: coords?.lng,
        radiusKm: coords ? Number(radiusKm) : undefined,
      });
      setResults(data);
    } catch (err) {
      setSearchError(err instanceof ApiError ? err.message : "Search failed. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const mapCenter: [number, number] = coords ? [coords.lat, coords.lng] : INDIA_CENTER;
  const markers = (results ?? []).map((org) => ({
    id: org.id,
    lat: org.lat,
    lng: org.lng,
    label: org.name,
    description: `${org.address}, ${org.city}`,
  }));

  const statItems = stats
    ? [
        { label: "Donors", value: stats.donorCount, icon: Users },
        { label: "Blood banks", value: stats.bloodBankCount, icon: Droplets },
        { label: "Hospitals", value: stats.hospitalCount, icon: Building2 },
        { label: "Active requests", value: stats.activeRequests, icon: Siren },
        { label: "Units fulfilled", value: stats.unitsFulfilled, icon: CheckCircle2 },
        { label: "Total donations", value: stats.totalDonations, icon: HeartPulse },
      ]
    : [];

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pb-12 pt-16 sm:pt-20">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 top-6 -z-10 h-80 w-80 rounded-full bg-red-200/40 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 top-44 -z-10 h-64 w-64 rounded-full bg-rose-200/30 blur-3xl"
        />

        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="text-center lg:text-left">
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-red-100 bg-white/80 px-3 py-1 text-xs font-semibold text-red-700 shadow-soft backdrop-blur">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500/70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-600" />
              </span>
              Real-time blood matching
            </span>
            <h1 className="text-balance text-4xl font-bold leading-[1.05] tracking-tight text-zinc-900 sm:text-5xl lg:text-[3.4rem]">
              Find the right blood, the moment it&apos;s needed.
            </h1>
            <p className="mx-auto mt-5 max-w-lg text-pretty text-base leading-relaxed text-zinc-600 lg:mx-0">
              BloodBank Finder links hospitals, blood banks, and voluntary donors in one live network — matching by
              blood type and distance so urgent requests reach the closest eligible donor in seconds.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <Link href="/register/donor">
                <Button size="lg" className="gap-2">
                  Become a donor <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/register/organization">
                <Button size="lg" variant="outline">
                  Register a hospital or blood bank
                </Button>
              </Link>
            </div>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-zinc-500 lg:justify-start">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-red-600" /> Verified organizations
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Bell className="h-4 w-4 text-red-600" /> Instant donor alerts
              </span>
              <span className="inline-flex items-center gap-1.5">
                <HeartPulse className="h-4 w-4 text-red-600" /> Free for donors
              </span>
            </div>
          </div>

          {/* Realistic in-product preview — reads as a live emergency request */}
          <div className="relative mx-auto w-full max-w-sm">
            <div
              aria-hidden
              className="absolute -inset-3 -z-10 rounded-[1.75rem] bg-gradient-to-br from-red-100/70 to-rose-50/40 blur-xl"
            />
            <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-lifted">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                  <Siren className="h-3.5 w-3.5" /> Critical request
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Live
                </span>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white shadow-soft">
                  <span className="text-lg font-bold leading-none">O&minus;</span>
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-zinc-900">Govt. General Hospital</p>
                  <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-zinc-500">
                    <MapPin className="h-3.5 w-3.5" /> Chennai &middot; 3 units needed
                  </p>
                </div>
              </div>
              <div className="mt-4 border-t border-zinc-100 pt-4">
                <p className="text-xs font-medium text-zinc-500">Compatible donors nearby</p>
                <div className="mt-2.5 flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {["AK", "SR", "MV", "RJ"].map((initials) => (
                      <span
                        key={initials}
                        className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-zinc-100 text-[10px] font-semibold text-zinc-600"
                      >
                        {initials}
                      </span>
                    ))}
                  </div>
                  <span className="text-xs text-zinc-500">+12 within 5 km</span>
                </div>
                <div className="mt-4 inline-flex w-full items-center gap-2 rounded-lg bg-zinc-900 px-3 py-2 text-xs font-medium text-white">
                  <Activity className="h-3.5 w-3.5" /> Notifying compatible donors…
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Unified live-stats strip */}
      {stats && (
        <section className="mx-auto w-full max-w-5xl px-4">
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-200/70 shadow-card sm:grid-cols-3 lg:grid-cols-6">
            {statItems.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="flex flex-col items-center gap-1 bg-white px-3 py-5 text-center">
                  <Icon className="h-4 w-4 text-red-500" />
                  <span className="text-2xl font-bold tracking-tight text-zinc-900">{s.value}</span>
                  <span className="text-xs font-medium text-zinc-500">{s.label}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="mx-auto w-full max-w-5xl px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
            From urgent request to matched donor
          </h2>
          <p className="mt-3 text-zinc-600">One coordinated flow, built for the minutes that matter.</p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div
                key={step.title}
                className="relative rounded-2xl border border-zinc-200 bg-white p-6 shadow-soft transition-shadow duration-200 hover:shadow-card"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="absolute right-5 top-5 text-sm font-semibold tabular-nums text-zinc-300">
                  0{i + 1}
                </span>
                <h3 className="mt-4 font-semibold text-zinc-900">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">{step.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Search */}
      <section className="mx-auto w-full max-w-5xl px-4 pb-16">
        <div className="rounded-2xl border border-zinc-200 bg-white/70 p-6 shadow-card sm:p-8">
          <h2 className="text-xl font-bold tracking-tight text-zinc-900">Find a hospital or blood bank near you</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Search verified organizations by city, blood type, or your current location.
          </p>

          <form onSubmit={handleSearch} className="mt-5 flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Input label="City" placeholder="e.g. Chennai" value={city} onChange={(e) => setCity(e.target.value)} />
              <Select label="Type" value={type} onChange={(e) => setType(e.target.value as OrgType | "")}>
                <option value="">Any</option>
                <option value="HOSPITAL">Hospital</option>
                <option value="BLOOD_BANK">Blood Bank</option>
              </Select>
              <Select
                label="Blood group in stock"
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value as BloodGroupLabel | "")}
              >
                <option value="">Any</option>
                {BLOOD_GROUPS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </Select>
              <Select
                label="Radius (km)"
                value={radiusKm}
                onChange={(e) => setRadiusKm(e.target.value)}
                disabled={!coords}
              >
                {RADIUS_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r} km
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <LocationField onLocate={setCoords} />
              {coords && (
                <p className="mt-1 text-xs text-green-600">
                  Using your location ({coords.lat.toFixed(4)}, {coords.lng.toFixed(4)})
                </p>
              )}
            </div>

            {searchError && (
              <p role="alert" className="text-sm text-red-600">
                {searchError}
              </p>
            )}
            <Button type="submit" isLoading={isSearching}>
              <Search className="h-4 w-4" />
              Search
            </Button>
          </form>
        </div>

        {results && (
          <div className="mt-6 grid gap-6 lg:grid-cols-2 lg:items-start">
            <div className="flex flex-col gap-4 lg:max-h-[480px] lg:overflow-y-auto lg:pr-2">
              {results.length === 0 ? (
                <Card className="flex flex-col items-center gap-2 py-10 text-center">
                  <SearchX className="h-8 w-8 text-zinc-300" />
                  <p className="text-sm text-zinc-500">No matching organizations found. Try widening your search.</p>
                </Card>
              ) : (
                results.map((org) => <OrgCard key={org.id} org={org} />)
              )}
            </div>
            <div className="lg:sticky lg:top-24">
              <MapView center={mapCenter} markers={markers} height="480px" />
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
