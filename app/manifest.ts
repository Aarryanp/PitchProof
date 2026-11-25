import type { MetadataRoute } from "next";

// Lets students install Pitchproof on their phone's home screen. It then
// opens full screen, without the browser bar, like a normal app.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pitchproof",
    short_name: "Pitchproof",
    description: "Find businesses that need your skills, prove it, and pitch them in your own words.",
    start_url: "/pipeline",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
