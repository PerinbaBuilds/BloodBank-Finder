"use client";

import dynamic from "next/dynamic";

export const LocationPicker = dynamic(() => import("./LocationPicker").then((m) => m.LocationPicker), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[280px] items-center justify-center rounded-xl bg-zinc-100 text-sm text-zinc-500">
      Loading map…
    </div>
  ),
});
