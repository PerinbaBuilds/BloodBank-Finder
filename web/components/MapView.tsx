"use client";

import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  label: string;
  description?: string;
}

function FitToContent({
  markers,
  center,
  zoom,
}: {
  markers: MapMarker[];
  center: [number, number];
  zoom: number;
}) {
  const map = useMap();
  // Stable key so we only re-frame when the actual set of points changes,
  // not on every parent re-render (which would fight the user's panning).
  const markerKey = markers.map((m) => `${m.lat},${m.lng}`).join("|");
  useEffect(() => {
    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng] as [number, number]));
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 14 });
    } else {
      map.setView(center, zoom);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markerKey, center[0], center[1], zoom, map]);
  return null;
}

export function MapView({
  center,
  markers,
  zoom = 12,
  height = "400px",
}: {
  center: [number, number];
  markers: MapMarker[];
  zoom?: number;
  height?: string;
}) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height, width: "100%", borderRadius: "0.75rem", zIndex: 0 }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitToContent markers={markers} center={center} zoom={zoom} />
      {markers.map((marker) => (
        <Marker key={marker.id} position={[marker.lat, marker.lng]} icon={defaultIcon}>
          <Popup>
            <strong>{marker.label}</strong>
            {marker.description && <div>{marker.description}</div>}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
