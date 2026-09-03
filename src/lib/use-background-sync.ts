// useBackgroundSync (Layer 4 + 5 state source).
//
// Tracks connectivity, a transient "syncing" flag shown right after reconnect,
// and the last time we successfully synced. Auto-invokes the supplied flush
// callback whenever connectivity transitions offline → online.
//
// Kept framework-light so it can be reused by the realtime manager, the sync
// manager, and the <OfflineIndicator /> banner.

import { useCallback, useEffect, useRef, useState } from "react";

const LAST_SYNC_KEY = "comrades_last_sync_time";

function readLastSync(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LAST_SYNC_KEY);
    return raw ? Number(raw) : null;
  } catch {
    return null;
  }
}

function writeLastSync(ts: number): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LAST_SYNC_KEY, String(ts));
  } catch {
    /* storage may be unavailable (private mode) — non-fatal */
  }
}

export interface BackgroundSyncState {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: number | null;
  /** Force a flush now (e.g. when the user re-opens the tab while online). */
  triggerSync: () => void;
}

interface UseBackgroundSyncOptions {
  /** Called when we believe we've (re)connected and should flush queued work. */
  onReconnect?: () => Promise<void> | void;
  /** How long the "Reconnected — syncing…" banner lingers, in ms. */
  syncingDurationMs?: number;
}

export function useBackgroundSync(options: UseBackgroundSyncOptions = {}): BackgroundSyncState {
  const { onReconnect, syncingDurationMs = 4000 } = options;

  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(() => readLastSync());

  // Keep the latest onReconnect without re-subscribing the event listeners.
  const reconnectRef = useRef(onReconnect);
  reconnectRef.current = onReconnect;

  const runReconnect = useCallback(async () => {
    setIsSyncing(true);
    try {
      await reconnectRef.current?.();
    } catch (err) {
      console.warn("Background sync reconnect handler failed:", err);
    } finally {
      const ts = Date.now();
      setLastSyncTime(ts);
      writeLastSync(ts);
      // Let the banner show briefly even if the flush was instantaneous.
      window.setTimeout(() => setIsSyncing(false), syncingDurationMs);
    }
  }, [syncingDurationMs]);

  const handleOnline = useCallback(() => {
    setIsOnline(true);
    void runReconnect();
  }, [runReconnect]);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // If we mounted already-online (e.g. returning to a backgrounded tab),
    // kick a sync once so queued work drains.
    if (navigator.onLine) {
      void runReconnect();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [handleOnline, handleOffline, runReconnect]);

  const triggerSync = useCallback(() => {
    if (typeof navigator !== "undefined" && !navigator.onLine) return;
    void runReconnect();
  }, [runReconnect]);

  return { isOnline, isSyncing, lastSyncTime, triggerSync };
}
