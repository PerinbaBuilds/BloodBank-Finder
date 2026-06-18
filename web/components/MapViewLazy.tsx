"use client";

import dynamic from "next/dynamic";

export const MapView = dynamic(() => import("./MapView").then((m) => m.MapView), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[300px] items-center justify-center rounded-xl bg-zinc-100 text-sm text-zinc-500">
      Loading map…
    </div>
  ),
});

export type { MapMarker } from "./MapView";
