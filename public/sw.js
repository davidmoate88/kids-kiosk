// Minimal PWA service worker for the app shell, not content.
// Content (- /watch, /tv, /api/*) is deliberately NOT cached — every page
// is PIN-gated and DB-driven, so serving stale/cached copies would be both
// confusing and a (weak) auth bypass. Only the static shell and favicons
// get cached, so the login screen and icons work with a flaky connection;
// the moment you're online the real pages fetch fresh.
//
// The PIN gate still applies on every navigation (the proxy.ts matcher
// excludes the .js workbox files by extension), so caching the shell never
// skips auth.

const SHELL_CACHE = "kids-kiosk-shell-v1";
const SHELL_ASSETS = [
  "/",
  "/manifest.webmanifest",
  "/icon.png",
  "/apple-touch-icon.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .catch(() => {
        // assets that 302 (e.g. "/" -> the PIN login, or an asset the proxy
        // bounces to login) can fail the whole addAll; a failed install just
        // means no offline shell, which is acceptable.
      })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== SHELL_CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Cached static assets -> serve from cache immediately, network otherwise.
  if (SHELL_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request))
    );
  }
});