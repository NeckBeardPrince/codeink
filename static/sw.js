const CACHE_NAME = "codeink-v2";

// Relative to the service worker scope so this also works when the app is
// served from a subpath (e.g. GitHub Pages project sites).
const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./favicon.svg",
  "./manifest.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

function cachePut(request, response) {
  if (response.ok) {
    const clone = response.clone();
    caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const requestUrl = new URL(request.url);
  if (requestUrl.origin !== self.location.origin) return;

  // Vendored assets live in version-stamped directories, so their URLs change
  // on upgrade and cache-first is safe.
  if (requestUrl.pathname.includes("/vendor/")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached || fetch(request).then((response) => cachePut(request, response))
      )
    );
    return;
  }

  // App shell: network-first so deployed fixes reach returning users, with
  // cache fallback for offline use.
  event.respondWith(
    fetch(request)
      .then((response) => cachePut(request, response))
      .catch(() =>
        caches.match(request).then((cached) => {
          if (cached) return cached;
          if (request.mode === "navigate") return caches.match("./");
          return Response.error();
        })
      )
  );
});
