const SHELL_CACHE = "boreal-shell-v1";
const RUNTIME_CACHE = "boreal-runtime-v1";
const CACHED_SHELL_ROUTES = [
  "/",
  "/about",
  "/chat",
  "/developers/agents",
  "/offline",
  "/papers",
  "/roadmap",
  "/manifest.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      await cache.addAll(CACHED_SHELL_ROUTES);
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const cacheKeys = await caches.keys();
      await Promise.all(
        cacheKeys
          .filter((key) => key !== SHELL_CACHE && key !== RUNTIME_CACHE)
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  if (url.pathname.startsWith("/api/")) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(handleNavigation(request));
    return;
  }

  if (
    url.pathname.startsWith("/_next/static/") ||
    request.destination === "font" ||
    request.destination === "script" ||
    request.destination === "style" ||
    request.destination === "worker"
  ) {
    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
    return;
  }

  if (request.destination === "image") {
    event.respondWith(cacheFirst(request, RUNTIME_CACHE));
  }
});

async function handleNavigation(request) {
  const shellCache = await caches.open(SHELL_CACHE);

  try {
    const response = await fetch(request);

    if (response.ok) {
      await shellCache.put(request, response.clone());
    }

    return response;
  } catch {
    const url = new URL(request.url);
    const cachedResponse =
      (await shellCache.match(request, { ignoreSearch: true })) ||
      (await shellCache.match(url.pathname, { ignoreSearch: true })) ||
      (await shellCache.match("/offline"));

    if (cachedResponse) {
      return cachedResponse;
    }

    return Response.error();
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  const networkPromise = fetch(request)
    .then(async (response) => {
      if (response.ok) {
        await cache.put(request, response.clone());
      }

      return response;
    })
    .catch(() => null);

  if (cachedResponse) {
    void networkPromise;
    return cachedResponse;
  }

  const networkResponse = await networkPromise;
  return networkResponse ?? Response.error();
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  const response = await fetch(request);

  if (response.ok) {
    await cache.put(request, response.clone());
  }

  return response;
}
