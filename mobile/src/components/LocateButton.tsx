import React, { useState } from "react";
import { Text } from "react-native";
import { Button } from "./ui/Button";
import { getCurrentPosition } from "../lib/geo";

export function LocateButton({ onLocate }: { onLocate: (coords: { lat: number; lng: number }) => void }) {
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState("");

  const handlePress = async () => {
    setError("");
    setIsLocating(true);
    try {
      const coords = await getCurrentPosition();
      onLocate(coords);
    } catch {
      setError("Could not get your location. Check location permissions.");
    } finally {
      setIsLocating(false);
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" isLoading={isLocating} onPress={handlePress}>
        Use my current location
      </Button>
      {error && <Text style={{ color: "#dc2626", fontSize: 12, marginTop: 4 }}>{error}</Text>}
    </>
  );
}
