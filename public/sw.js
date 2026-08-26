/*
 * COMRACARE service worker — conservative by design.
 *
 * 1. Web push: receives notifications fired by the clinic server and shows
 *    them even when every tab is closed. Clicking one focuses/opens the right
 *    page (My Visits for students, the portal for clinicians).
 * 2. Offline fallback: navigations are always network-first (never serve a
 *    stale app shell); when the network fails, show the branded offline page.
 *    Static assets are NOT precached — the app must always be the freshest.
 */

const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open("comracare-static-v1").then((cache) => cache.add(OFFLINE_URL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      await self.clients.claim();
      // Drop old caches from previous SW versions.
      const names = await caches.keys();
      await Promise.all(
        names.filter((n) => n !== "comracare-static-v1").map((n) => caches.delete(n)),
      );
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.mode !== "navigate") return;
  event.respondWith(
    (async () => {
      try {
        return await fetch(req);
      } catch {
        const cache = await caches.open("comracare-static-v1");
        return (await cache.match(OFFLINE_URL)) || Response.error();
      }
    })(),
  );
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
