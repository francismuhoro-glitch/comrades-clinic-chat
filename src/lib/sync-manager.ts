// Background sync manager (Layer 4).
//
// Single owner of the "connectivity changed" side effects:
//   • flush queued chat messages to Supabase
//   • drain the generic sync_queue (offline payment claims, etc.)
//   • restart Supabase Realtime + backfill missed messages
//   • invalidate in-flight TanStack Query caches
//   • register the Service Worker Background Sync tag as a fallback
//
// The chat UI and the <OfflineIndicator /> stay dumb — they just call into
// `flushAll()` (via the hook) and read `useBackgroundSync()` state.

import { onlineManager, type QueryClient } from "@tanstack/react-query";

import { flushMessageQueue } from "./message-queue";
import { getSyncQueue, removeSyncItem } from "./offline-db";
import { getClinicApiState } from "./clinic-store";
import { restartRealtime, stopRealtime } from "./realtime-manager";

let registered = false;

/** Best-effort access to the live QueryClient so we can invalidate on reconnect. */
function getQueryClient(): QueryClient | null {
  try {
    // The app registers a single router instance on the TanStack Router registry.
    const registry = (globalThis as unknown as Record<string, Record<string, unknown>>)[
      "__tanstackRouter"
    ] as Record<string, unknown> | undefined;
    return (registry?.["queryClient"] as QueryClient | undefined) ?? null;
  } catch {
    return null;
  }
}

async function flushSyncQueue(): Promise<void> {
  try {
    const items = await getSyncQueue();
    if (items.length === 0) return;

    const clinic = getClinicApiState();
    if (!clinic) return;

    for (const item of items) {
      try {
        if (item.type === "payment") {
          const id = String(item.payload["id"] ?? "");
          const code = String(item.payload["mpesaCode"] ?? "");
          const phone = String(item.payload["paymentPhone"] ?? "");
          if (id && code) await clinic.submitPaymentClaim(id, code, phone);
        } else if (item.type === "intake") {
          const input = item.payload["intake"] as
            | Parameters<typeof clinic.createSession>[0]
            | undefined;
          if (input) clinic.createSession(input);
        }
        await removeSyncItem(item.id);
      } catch (err) {
        console.warn(`sync_queue item ${item.id} (${item.type}) failed:`, err);
        // Leave it queued for the next reconnect attempt.
      }
    }
  } catch (err) {
    console.warn("flushSyncQueue error:", err);
  }
}

/** Drain every offline mutation we have. Safe to call repeatedly. */
export async function flushAll(): Promise<void> {
  try {
    await flushMessageQueue();
  } catch (err) {
    console.warn("flushMessageQueue error:", err);
  }
  try {
    await flushSyncQueue();
  } catch (err) {
    console.warn("flushSyncQueue error:", err);
  }
  try {
    await restartRealtime();
  } catch (err) {
    console.warn("restartRealtime error:", err);
  }
  try {
    getQueryClient()?.invalidateQueries();
  } catch (err) {
    console.warn("query invalidation error:", err);
  }
}

type SyncCapableRegistration = ServiceWorkerRegistration & {
  sync?: { register: (tag: string) => Promise<void> };
};

/**
 * Register the Background Sync tag — only where the API actually exists.
 *
 * Safari (and Firefox) ship no Background Sync, so `registration.sync` is
 * `undefined` there. We feature-check after awaiting `serviceWorker.ready` and
 * return silently instead of throwing: those browsers drain the queue through
 * the `online` / `visibilitychange` listeners wired below (and through the
 * `SYNC_NOW` message the SW posts when its own sync event fires).
 */
function registerBackgroundSyncTag(): void {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  void (async () => {
    try {
      const reg = (await navigator.serviceWorker.ready) as SyncCapableRegistration;
      if (!("sync" in reg) || reg.sync === undefined) return;
      await reg.sync.register("sync-messages");
    } catch {
      /* Background Sync unsupported or registration rejected — non-fatal. */
    }
  })();
}

/**
 * Wire up the global online/offline listeners and TanStack Query's
 * onlineManager. Idempotent — call once at app boot.
 */
export function registerSyncManager(): void {
  if (registered || typeof window === "undefined") return;
  registered = true;

  onlineManager.setEventListener((setOnline) => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    setOnline(navigator.onLine); // seed initial state
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  });

  window.addEventListener("online", () => {
    void flushAll();
    registerBackgroundSyncTag();
  });

  window.addEventListener("offline", () => {
    stopRealtime();
  });

  // The SW Background Sync handler asks the (online) tab to perform the flush.
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data && event.data.type === "SYNC_NOW") {
        void flushAll();
      }
    });
  }

  // Drain on tab focus if we came back online while backgrounded.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && navigator.onLine) {
      void flushAll();
    }
  });

  // If we loaded already-online, attempt an initial drain.
  if (navigator.onLine) {
    void flushAll();
  }
}
