const SHELL_CACHE = "blokblitz-shell-v3";
const STATIC_CACHE = "blokblitz-static-v3";
const CACHES = [SHELL_CACHE, STATIC_CACHE];
const APP_SHELL = ["/", "/index.html", "/favicon.svg", "/site.webmanifest"];

const assetReferences = (source) =>
  [...source.matchAll(/(?:\/)?assets\/[A-Za-z0-9_-]+\.(?:js|css)/g)].map((match) => (match[0].startsWith("/") ? match[0] : `/${match[0]}`));

const cacheAsset = async (cache, path) => {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Could not precache ${path}`);
  await cache.put(path, response.clone());
  return response;
};

const precacheProductionBundles = async () => {
  const shell = await caches.open(SHELL_CACHE);
  await shell.addAll(APP_SHELL);
  const index = await shell.match("/index.html");
  if (!index) throw new Error("Missing cached production index");

  const html = await index.text();
  const entryPaths = [...new Set(assetReferences(html))];
  const staticCache = await caches.open(STATIC_CACHE);
  const entryResponses = await Promise.all(entryPaths.map((path) => cacheAsset(staticCache, path)));
  const entrySources = await Promise.all(
    entryResponses.map((response, index) => (entryPaths[index].endsWith(".js") ? response.text() : Promise.resolve("")))
  );
  const lazyPaths = [...new Set(entrySources.flatMap(assetReferences))].filter((path) => !entryPaths.includes(path));
  await Promise.all(lazyPaths.map((path) => cacheAsset(staticCache, path)));
};

self.addEventListener("install", (event) => {
  event.waitUntil(precacheProductionBundles().then(() => self.skipWaiting()));
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
