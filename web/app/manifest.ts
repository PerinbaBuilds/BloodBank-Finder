import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BloodBank Finder",
    short_name: "BloodBank",
    description: "Hyper-local emergency blood locator connecting donors, hospitals, and blood banks.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#dc2626",
    icons: [{ src: "/icon", sizes: "512x512", type: "image/png" }],
  };
}
