"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { LocateButton } from "@/components/LocateButton";
import { LocationPicker } from "@/components/LocationPickerLazy";

const INDIA_CENTER: [number, number] = [20.5937, 78.9629];

export function LocationField({
  onLocate,
  initialCenter,
}: {
  onLocate: (coords: { lat: number; lng: number }) => void;
  initialCenter?: [number, number];
}) {
  const [isPicking, setIsPicking] = useState(false);

  if (isPicking) {
    return (
      <LocationPicker
        center={initialCenter ?? INDIA_CENTER}
        onConfirm={(coords) => {
          onLocate(coords);
          setIsPicking(false);
        }}
        onCancel={() => setIsPicking(false)}
      />
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <LocateButton onLocate={onLocate} />
      <Button type="button" variant="outline" size="sm" onClick={() => setIsPicking(true)}>
        Pick on map
      </Button>
    </div>
  );
}
