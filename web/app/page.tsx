"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, CheckCircle2, Droplets, HeartPulse, Search, SearchX, Siren, Users } from "lucide-react";
import { ApiError, organizationsApi, statsApi } from "@/lib/api";
import { BLOOD_GROUPS } from "@/lib/constants";
import type { BloodGroupLabel, OrgType, OrganizationWithInventory, StatsOverview } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/StatCard";
import { OrgCard } from "@/components/OrgCard";
import { LocateButton } from "@/components/LocateButton";
import { MapView } from "@/components/MapViewLazy";

const INDIA_CENTER: [number, number] = [20.5937, 78.9629];
const RADIUS_OPTIONS = ["5", "10", "25", "50", "100"];

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

  return (
    <div className="flex flex-col">
      <section className="relative overflow-hidden bg-gradient-to-b from-red-50 via-red-50/40 to-white px-4 py-16 text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[480px] bg-[radial-gradient(ellipse_at_top,_rgba(220,38,38,0.12),_transparent_70%)]"
        />
        <span className="mx-auto mb-5 inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-white px-3 py-1 text-xs font-semibold text-red-700 shadow-soft">
          <HeartPulse className="h-3.5 w-3.5" />
          Live, real-time blood matching
        </span>
        <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
          Find blood when every minute counts.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-zinc-600">
          BloodBank Finder connects voluntary donors, hospitals, and blood banks in real time to resolve urgent
          blood shortages — wherever you are.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/register/donor">
            <Button size="lg">Become a Donor</Button>
          </Link>
          <Link href="/register/organization">
            <Button size="lg" variant="outline">
              Register a Hospital / Blood Bank
            </Button>
          </Link>
        </div>
      </section>

      {stats && (
        <section className="mx-auto -mt-6 grid w-full max-w-5xl grid-cols-2 gap-4 px-4 sm:grid-cols-3 md:grid-cols-6">
          <StatCard label="Donors" value={stats.donorCount} icon={Users} />
          <StatCard label="Blood Banks" value={stats.bloodBankCount} icon={Droplets} />
          <StatCard label="Hospitals" value={stats.hospitalCount} icon={Building2} />
          <StatCard label="Active Requests" value={stats.activeRequests} icon={Siren} />
          <StatCard label="Units Fulfilled" value={stats.unitsFulfilled} icon={CheckCircle2} />
          <StatCard label="Total Donations" value={stats.totalDonations} icon={HeartPulse} />
        </section>
      )}

      <section className="mx-auto w-full max-w-5xl px-4 py-12">
        <h2 className="text-xl font-bold text-zinc-900">Find a hospital or blood bank near you</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Search verified organizations by city, blood type, or your current location.
        </p>

        <Card className="mt-4 shadow-card">
          <form onSubmit={handleSearch} className="flex flex-col gap-4">
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
              <LocateButton onLocate={setCoords} />
              {coords && (
                <p className="mt-1 text-xs text-green-600">
                  Using your location ({coords.lat.toFixed(4)}, {coords.lng.toFixed(4)})
                </p>
              )}
            </div>

            {searchError && <p className="text-sm text-red-600">{searchError}</p>}
            <Button type="submit" isLoading={isSearching}>
              <Search className="h-4 w-4" />
              Search
            </Button>
          </form>
        </Card>

        {results && (
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="flex flex-col gap-4">
              {results.length === 0 ? (
                <Card className="flex flex-col items-center gap-2 py-10 text-center">
                  <SearchX className="h-8 w-8 text-zinc-300" />
                  <p className="text-sm text-zinc-500">No matching organizations found. Try widening your search.</p>
                </Card>
              ) : (
                results.map((org) => <OrgCard key={org.id} org={org} />)
              )}
            </div>
            <MapView center={mapCenter} markers={markers} height="480px" />
          </div>
        )}
      </section>
    </div>
  );
}
