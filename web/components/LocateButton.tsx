"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { getCurrentPosition } from "@/lib/geo";

export function LocateButton({ onLocate }: { onLocate: (coords: { lat: number; lng: number }) => void }) {
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState("");

  const handleClick = async () => {
    setIsLocating(true);
    setError("");
    try {
      const coords = await getCurrentPosition();
      onLocate(coords);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not get your location");
    } finally {
      setIsLocating(false);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <Button type="button" variant="outline" size="sm" isLoading={isLocating} onClick={handleClick}>
        Use my current location
      </Button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
