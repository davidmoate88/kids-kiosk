import type { MetadataRoute } from "next";

// PWA installability manifest — see the "This is NOT the Next.js you know"
// note in AGENTS.md; App Router supports app/manifest.ts directly.
// Requires HTTPS (the Cloudflare Tunnel the phone-app work adds) before any
// browser will treat the site as installable.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "George & Arthur's Play Zone",
    short_name: "Kids Kiosk",
    description: "Games, colouring, learning and approved shows for George and Arthur.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#fdf6ec",
    theme_color: "#fdf6ec",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}