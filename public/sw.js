const SHELL_CACHE = "blokblitz-shell-v2";
const STATIC_CACHE = "blokblitz-static-v2";
const CACHES = [SHELL_CACHE, STATIC_CACHE];
const APP_SHELL = ["/", "/index.html", "/favicon.svg", "/site.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((name) => !CACHES.includes(name)).map((name) => caches.delete(name))))
      .then(() => self.clients.claim())
  );
});

// Vite content-hashed bundles and the local voice/audio pack never change for
// a given URL, so serve them cache-first: repeat visits and repeat voice-clip
// playback are instant and work fully offline. Everything else (the HTML
// shell, manifest) stays network-first so a new deploy is picked up on the
// next visit while offline still falls back to the cached shell.
const isImmutable = (url) => url.pathname.startsWith("/assets/") || url.pathname.startsWith("/audio/");

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (isImmutable(url)) {
    event.respondWith(
      caches.match(request.url, { ignoreSearch: false }).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(STATIC_CACHE).then((cache) => cache.put(request.url, copy));
            }
            return response;
          })
      )
    );
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(SHELL_CACHE).then((cache) => cache.put(request, copy));
        return response;
      })
      .catch(() =>
        caches.match(request).then((cached) => {
          if (cached) return cached;
          if (request.mode === "navigate") return caches.match("/index.html");
          return Response.error();
        })
      )
  );
});
