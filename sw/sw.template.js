// Source of public/sw.js. scripts/build-sw.ts fills in the cache version.
const CACHE_VERSION = "__CACHE_VERSION__";
const CACHE = `be-yeu-${CACHE_VERSION}`;
const SHELL = [
  "/",
  "/offline",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
];
// Every page is a static client shell, the same for every user, so it is safe to keep.
const PAGES = [
  "/nhat-ky",
  "/thong-ke",
  "/tang-truong",
  "/cam-nang",
  "/tien-ich",
  "/cai-dat",
  "/cai-app",
  "/dang-nhap",
  "/khai-bao-be",
  "/chua-duoc-moi",
];
const GUIDES = [
  "/khan-cap",
  "/tiem-chung",
  "/trieu-chung",
  "/benh-thuong-gap",
  "/bong-be",
  "/phat-trien",
];
const FALLBACK_TITLE = "Bé Yêu có thông báo mới";

function staticAssets(html) {
  return [...new Set(html.match(/\/_next\/static\/[^"'\s)<>\\]+/g) || [])];
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await cache.addAll(SHELL);
      const optional = [...PAGES, ...GUIDES];
      await Promise.allSettled(optional.map((url) => cache.add(url)));
      const assets = [];
      for (const url of ["/", "/offline", ...optional]) {
        const page = await cache.match(url);
        if (page) assets.push(...staticAssets(await page.text()));
      }
      await Promise.allSettled(
        [...new Set(assets)].map((url) => cache.add(url)),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  // The OAuth callback URL carries a one-time code; never keep it.
  const keep = !new URL(request.url).pathname.startsWith("/auth/");
  try {
    const response = await fetch(request);
    if (keep && response.status === 200 && !response.redirected)
      await cache.put(request, response.clone());
    return response;
  } catch {
    return (
      (await cache.match(request, { ignoreSearch: true })) ||
      (await cache.match("/offline")) ||
      Response.error()
    );
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.status === 200) await cache.put(request, response.clone());
  return response;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  // Supabase and every other host go straight to the network.
  if (url.origin !== self.location.origin) return;
  if (request.mode === "navigate") event.respondWith(networkFirst(request));
  else if (url.pathname.startsWith("/_next/static/"))
    event.respondWith(cacheFirst(request));
});

function readPayload(event) {
  try {
    const data = event.data ? event.data.json() : null;
    return data && typeof data === "object" ? data : {};
  } catch {
    return {};
  }
}

self.addEventListener("push", (event) => {
  const data = readPayload(event);
  const title =
    typeof data.title === "string" && data.title ? data.title : FALLBACK_TITLE;
  event.waitUntil(
    self.registration.showNotification(title, {
      body: typeof data.body === "string" ? data.body : "",
      tag: typeof data.tag === "string" ? data.tag : undefined,
      icon: "/icons/icon-192.png",
      data: { url: typeof data.url === "string" ? data.url : "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const client of windows) {
        try {
          await client.focus();
          await client.navigate(url);
          return;
        } catch {
          // An uncontrolled window cannot navigate; open a new one instead.
        }
      }
      await self.clients.openWindow(url);
    })(),
  );
});
