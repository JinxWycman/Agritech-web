const CACHE_NAME = "agritech-shell-v1";
const OFFLINE_URL = "/offline";
const PRECACHE_URLS = [OFFLINE_URL, "/icons/sprout.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/backend/") || url.pathname.startsWith("/api/")) return;
  if (url.hostname.includes("tile.openstreetmap.org")) return;
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok) await cache.put(request, response.clone());
      return response;
    }));
    return;
  }
  if (request.mode !== "navigate") return;
  event.respondWith((async () => {
    try {
      const response = await fetch(request);
      const cacheControl = response.headers.get("Cache-Control") || "";
      // Keep this cacheability rule aligned with src/lib/pwa.ts.
      const cacheable = request.method === "GET" && response.status === 200 && !url.pathname.startsWith("/backend/") && !url.pathname.startsWith("/api/") && !/no-store|private/i.test(cacheControl);
      if (cacheable) await (await caches.open(CACHE_NAME)).put(request, response.clone());
      return response;
    } catch {
      return (await caches.match(request)) || (await caches.match(OFFLINE_URL));
    }
  })());
});
