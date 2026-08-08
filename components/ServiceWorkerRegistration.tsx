"use client";

import { useEffect } from "react";

// Registers the PWA service worker once, client-side only (there is no
// `window` at server render). Pure side effect with no cleanup — matching
// the react-hooks rule's "external system, no dependent state" carve-out.
// HTTPS-only: browsers require a secure context before service workers
// register at all, so this is a no-op on the plain-HTTP LAN deploy and only
// activates through the Cloudflare Tunnel.
export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      // best-effort only — a failed SW never blocks the app itself
    });
  }, []);
  return null;
}