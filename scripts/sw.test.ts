import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { buildServiceWorker } from "./build-sw";

const ORIGIN = "https://bunkid.test";
type Listener = (event: Record<string, unknown>) => void;

// Each fake page links one static file named after it; "/" links two.
function pageHtml(url: string): string {
  if (url.startsWith("/_next/")) return `asset ${url}`;
  if (url === "/")
    return '<script src="/_next/static/chunks/app.js"></script><link href="/_next/static/css/a.css">';
  return `<script src="/_next/static/chunks${url}.js"></script>`;
}

function fakeCaches() {
  const stores = new Map<string, Map<string, Response>>();
  const keyOf = (input: string | Request) =>
    typeof input === "string"
      ? new URL(input, ORIGIN).pathname
      : new URL(input.url).pathname;
  const open = async (name: string) => {
    if (!stores.has(name)) stores.set(name, new Map());
    const store = stores.get(name)!;
    return {
      match: async (input: string | Request) =>
        store.get(keyOf(input))?.clone(),
      put: async (input: string | Request, response: Response) => {
        store.set(keyOf(input), response);
      },
      add: vi.fn(async (url: string) => {
        store.set(keyOf(url), new Response(pageHtml(url)));
      }),
      addAll: vi.fn(async (urls: string[]) => {
        for (const url of urls)
          store.set(keyOf(url), new Response(pageHtml(url)));
      }),
    };
  };
  return {
    stores,
    api: {
      open,
      keys: async () => [...stores.keys()],
      delete: async (name: string) => stores.delete(name),
    },
  };
}

function loadWorker(fetchImpl: (request: Request) => Promise<Response>) {
  const listeners: Record<string, Listener> = {};
  const caches = fakeCaches();
  const windowClient = {
    focus: vi.fn(async () => undefined),
    navigate: vi.fn(async () => undefined),
  };
  const self = {
    location: { origin: ORIGIN },
    addEventListener: (type: string, listener: Listener) => {
      listeners[type] = listener;
    },
    skipWaiting: vi.fn(async () => undefined),
    registration: { showNotification: vi.fn(async () => undefined) },
    clients: {
      claim: vi.fn(async () => undefined),
      matchAll: vi.fn(async () => [] as (typeof windowClient)[]),
      openWindow: vi.fn(async () => undefined),
    },
  };
  const source = buildServiceWorker(
    readFileSync("sw/sw.template.js", "utf8"),
    "test",
  );
  new Function("self", "caches", "fetch", source)(self, caches.api, fetchImpl);
  return { listeners, caches, self, windowClient };
}

async function dispatch(listener: Listener, extra: Record<string, unknown>) {
  let waited: Promise<unknown> | undefined;
  let responded: Promise<Response> | undefined;
  listener({
    ...extra,
    waitUntil: (p: Promise<unknown>) => (waited = p),
    respondWith: (p: Promise<Response>) => (responded = p),
  });
  await waited;
  return responded ? await responded : undefined;
}

describe("service worker", () => {
  it("install caches the shell, every page and the static files each page links", async () => {
    const { listeners, caches, self } = loadWorker(async () => new Response());
    await dispatch(listeners.install, {});
    const store = caches.stores.get("be-yeu-test")!;
    expect([...store.keys()]).toEqual(
      expect.arrayContaining([
        "/",
        "/offline",
        "/manifest.webmanifest",
        "/icons/icon-192.png",
        "/icons/icon.svg",
        "/icons/maskable-512.png",
        "/nhat-ky",
        "/thong-ke",
        "/kham-pha",
        "/suc-khoe",
        "/tien-ich",
        "/tang-truong/chieu-cao",
        "/dot-om",
        "/dot-om/chi-tiet",
        "/cai-dat/thanh-vien",
        "/cai-dat/nhac-thuoc",
        "/dang-nhap",
        "/khan-cap",
        "/_next/static/chunks/app.js",
        "/_next/static/css/a.css",
        "/_next/static/chunks/offline.js",
        "/_next/static/chunks/nhat-ky.js",
      ]),
    );
    expect(self.skipWaiting).toHaveBeenCalled();
  });

  it("activate deletes caches of older versions", async () => {
    const { listeners, caches, self } = loadWorker(async () => new Response());
    await caches.api.open("be-yeu-old");
    await caches.api.open("be-yeu-test");
    await dispatch(listeners.activate, {});
    expect([...caches.stores.keys()]).toEqual(["be-yeu-test"]);
    expect(self.clients.claim).toHaveBeenCalled();
  });

  it("navigations are network-first and fall back to the cache, then /offline", async () => {
    let online = true;
    const { listeners } = loadWorker(async () => {
      if (!online) throw new TypeError("Failed to fetch");
      return new Response("fresh nhat-ky", { status: 200 });
    });
    await dispatch(listeners.install, {});
    const nav = (path: string) =>
      dispatch(listeners.fetch, {
        request: { method: "GET", url: `${ORIGIN}${path}`, mode: "navigate" },
      });
    expect(await (await nav("/nhat-ky"))!.text()).toBe("fresh nhat-ky");
    online = false;
    expect(await (await nav("/nhat-ky?x=1"))!.text()).toBe("fresh nhat-ky");
    // Spec 2026-11-26 §6.1: an episode's page opens offline whatever its id,
    // from the shell kept at install.
    expect(await (await nav("/dot-om/chi-tiet?id=abc"))!.text()).toContain(
      "chunks/dot-om/chi-tiet.js",
    );
    expect(await (await nav("/xem-them"))!.text()).toContain(
      "chunks/offline.js",
    );
    online = true;
    await nav("/auth/callback?code=abc");
    online = false;
    expect(await (await nav("/auth/callback?code=abc"))!.text()).toContain(
      "chunks/offline.js",
    );
  });

  it("static files are cache-first; other hosts and non-GET requests are left alone", async () => {
    const network = vi.fn(async () => new Response("asset", { status: 200 }));
    const { listeners } = loadWorker(network);
    const get = (url: string, method = "GET") =>
      dispatch(listeners.fetch, { request: { method, url, mode: "cors" } });
    await get(`${ORIGIN}/_next/static/chunks/x.js`);
    await get(`${ORIGIN}/_next/static/chunks/x.js`);
    expect(network).toHaveBeenCalledTimes(1);
    expect(await get("https://abc.supabase.co/rest/v1/logs")).toBeUndefined();
    expect(await get(`${ORIGIN}/api/x`, "POST")).toBeUndefined();
  });

  it("push always shows a notification, even with a broken payload", async () => {
    const { listeners, self } = loadWorker(async () => new Response());
    await dispatch(listeners.push, {
      data: {
        json: () => ({
          title: "Đến giờ bú rồi",
          body: "Cữ trước lúc 07:00",
          tag: "feed:b1",
          url: "/",
        }),
      },
    });
    await dispatch(listeners.push, {
      data: {
        json: () => {
          throw new SyntaxError("bad json");
        },
      },
    });
    expect(self.registration.showNotification).toHaveBeenNthCalledWith(
      1,
      "Đến giờ bú rồi",
      expect.objectContaining({
        body: "Cữ trước lúc 07:00",
        tag: "feed:b1",
        data: { url: "/" },
      }),
    );
    expect(self.registration.showNotification).toHaveBeenNthCalledWith(
      2,
      "Kim Bun có thông báo mới",
      expect.objectContaining({ data: { url: "/" } }),
    );
  });

  it("notificationclick focuses an open window or opens a new one", async () => {
    const { listeners, self, windowClient } = loadWorker(
      async () => new Response(),
    );
    const close = vi.fn();
    const click = () =>
      dispatch(listeners.notificationclick, {
        notification: { close, data: { url: "/tiem-chung" } },
      });
    await click();
    expect(self.clients.openWindow).toHaveBeenCalledWith("/tiem-chung");
    self.clients.matchAll.mockResolvedValueOnce([windowClient]);
    await click();
    expect(windowClient.focus).toHaveBeenCalled();
    expect(windowClient.navigate).toHaveBeenCalledWith("/tiem-chung");
    expect(close).toHaveBeenCalledTimes(2);
  });
});
