"use client";

import { useState } from "react";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/Button";

const pickIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function ClickCapture({ onPick }: { onPick: (coords: { lat: number; lng: number }) => void }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export function LocationPicker({
  center,
  onConfirm,
  onCancel,
}: {
  center: [number, number];
  onConfirm: (coords: { lat: number; lng: number }) => void;
  onCancel: () => void;
}) {
  const [selected, setSelected] = useState<{ lat: number; lng: number } | null>(null);

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-zinc-500">Tap anywhere on the map to drop a pin at that location.</p>
      <MapContainer
        center={center}
        zoom={12}
        style={{ height: "280px", width: "100%", borderRadius: "0.75rem", zIndex: 0 }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickCapture onPick={setSelected} />
        {selected && <Marker position={[selected.lat, selected.lng]} icon={pickIcon} />}
      </MapContainer>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" disabled={!selected} onClick={() => selected && onConfirm(selected)}>
          Confirm location
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        {selected && (
          <p className="text-xs text-green-600">
            {selected.lat.toFixed(4)}, {selected.lng.toFixed(4)}
          </p>
        )}
      </div>
    </div>
  );
}
