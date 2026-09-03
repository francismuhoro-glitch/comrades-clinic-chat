/*
 * COMRACARE service worker.
 *
 * Responsibilities:
 *  1. Web push — receive clinic notifications and surface them even with no tab open
 *     (existing behaviour, preserved below).
 *  2. Offline app shell — cache the shell + static assets so the PWA loads with
 *     zero connectivity. Uses versioned caches so a deploy invalidates old ones.
 *  3. Background Sync fallback — when the tab is backgrounded, ask the client to
 *     flush any queued work once connectivity returns.
 *
 * Cache strategies:
 *  - Navigations (HTML):      Stale-While-Revalidate (instant load, fresh next time)
 *  - Static assets (js/css/svg/png/woff): Cache-First (hashed, immutable)
 *  - API / Supabase:         Network-First with cache fallback (never serve stale auth)
 *  - Authenticated API + WebSocket (realtime): NEVER cached (security + correctness)
 */

const APP_SHELL_CACHE = "comracare-shell-v2";
const ASSETS_CACHE = "comracare-assets-v2";
const API_CACHE = "comracare-api-v2";
const OFFLINE_URL = "/offline.html";

// Paths that must always hit the network (auth, realtime, mutations).
function isNetworkOnly(url) {
  if (url.origin !== self.location.origin) return true; // Supabase, fonts CDN, etc.
  const path = url.pathname;
  if (
    path.startsWith("/api/") ||
    path.startsWith("/rest/v1/") ||
    path.startsWith("/realtime/") ||
    path.startsWith("/auth/") ||
    path.startsWith("/functions/") ||
    path.startsWith("/storage/")
  ) {
    return true;
  }
  return false;
}

function isNavigation(req) {
  return req.mode === "navigate";
}

function isStaticAsset(url) {
  const path = url.pathname;
  return /\.(?:js|mjs|css|svg|png|jpe?g|gif|webp|ico|woff2?|ttf|json|webmanifest)$/i.test(path);
}

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(APP_SHELL_CACHE).then((cache) => cache.add(OFFLINE_URL)));
  // Register a background sync tag as a fallback for queued work.
  try {
    event.waitUntil(self.registration.sync.register("sync-messages"));
  } catch {
    // Background Sync unsupported (Safari/Firefox) — the online event covers us.
  }
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      await self.clients.claim();
      const names = await caches.keys();
      await Promise.all(
        names
          .filter(
            (n) =>
              n !== APP_SHELL_CACHE &&
              n !== ASSETS_CACHE &&
              n !== API_CACHE &&
              n !== "comracare-static-v1",
          )
          .map((n) => caches.delete(n)),
      );
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Authenticated / realtime traffic: never intercept.
  if (isNetworkOnly(url)) return;

  // Navigations: Stale-While-Revalidate.
  if (isNavigation(req)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(APP_SHELL_CACHE);
        const cached = await cache.match(req);
        const network = fetch(req)
          .then((res) => {
            if (res && res.status === 200) cache.put(req, res.clone());
            return res;
          })
          .catch(() => cached);
        return cached || network || cache.match(OFFLINE_URL) || Response.error();
      })(),
    );
    return;
  }

  // Static assets: Cache-First (then network, and cache the result).
  if (isStaticAsset(url) && req.method === "GET") {
    event.respondWith(
      (async () => {
        const cache = await caches.open(ASSETS_CACHE);
        const cached = await cache.match(req);
        if (cached) return cached;
        try {
          const res = await fetch(req);
          if (res && res.status === 200) cache.put(req, res.clone());
          return res;
        } catch {
          return cached || Response.error();
        }
      })(),
    );
    return;
  }

  // Everything else (public data-ish GETs): Network-First with cache fallback.
  if (req.method === "GET") {
    event.respondWith(
      (async () => {
        const cache = await caches.open(API_CACHE);
        try {
          const res = await fetch(req);
          if (res && res.status === 200) cache.put(req, res.clone());
          return res;
        } catch {
          const cached = await cache.match(req);
          return cached || Response.error();
        }
      })(),
    );
  }
});

// Background Sync: the worker can't reach IndexedDB easily here, so ask the
// foreground tab (which has full app context) to perform the flush.
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-messages") {
    event.waitUntil(
      (async () => {
        const clientList = await self.clients.matchAll({
          type: "window",
          includeUncontrolled: true,
        });
        for (const client of clientList) {
          client.postMessage({ type: "SYNC_NOW" });
        }
      })(),
    );
  }
});

self.addEventListener("push", (event) => {
  let payload = {
    title: "COMRACARE Student Clinic",
    body: "You have a new clinic update.",
    url: "/visits",
  };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch {
    // Non-JSON push — fall back to the generic message.
  }
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: payload.tag || "comracare",
      data: { url: payload.url || "/visits" },
      silent: false,
      renotify: true,
      vibrate: [300, 120, 300],
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/visits";
  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of clientList) {
        try {
          const path = new URL(client.url).pathname;
          if (path === target || path === "/") {
            await client.focus();
            if (path !== target && "navigate" in client) await client.navigate(target);
            return;
          }
        } catch {
          // ignore malformed client URLs
        }
      }
      await self.clients.openWindow(target);
    })(),
  );
});
