"use client";

import { useEffect, useState } from "react";
import { Droplet } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ApiError, inventoryApi } from "@/lib/api";
import { BLOOD_GROUPS } from "@/lib/constants";
import type { BloodGroupLabel } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { PageHeader } from "@/components/PageHeader";

function emptyUnits(): Record<BloodGroupLabel, string> {
  return Object.fromEntries(BLOOD_GROUPS.map((g) => [g, "0"])) as Record<BloodGroupLabel, string>;
}

function InventoryEditor() {
  const [units, setUnits] = useState<Record<BloodGroupLabel, string> | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    inventoryApi
      .getMine()
      .then((items) => {
        const map = emptyUnits();
        for (const item of items) map[item.bloodGroup] = String(item.units);
        setUnits(map);
      })
      .catch(() => setUnits(emptyUnits()));
  }, []);

  if (!units) return <Spinner />;

  const update = (group: BloodGroupLabel) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setUnits((prev) => (prev ? { ...prev, [group]: e.target.value } : prev));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setIsSaving(true);
    try {
      await inventoryApi.upsertMine(BLOOD_GROUPS.map((g) => ({ bloodGroup: g, units: Number(units[g]) || 0 })));
      setSuccess(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save inventory.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <PageHeader
        icon={Droplet}
        title="Manage blood inventory"
        subtitle="Keep your stock levels current so hospitals and donors see accurate availability."
      />

      <Card className="mt-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {BLOOD_GROUPS.map((group) => (
              <Input
                key={group}
                label={`${group} (units)`}
                type="number"
                min={0}
                max={100000}
                value={units[group]}
                onChange={update(group)}
              />
            ))}
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-600">Inventory updated.</p>}
          <Button type="submit" isLoading={isSaving} className="w-full">
            Save inventory
          </Button>
        </form>
      </Card>
    </div>
  );
}

export default function InventoryPage() {
  return (
    <ProtectedRoute roles={["BLOOD_BANK"]}>
      <InventoryEditor />
    </ProtectedRoute>
  );
}
