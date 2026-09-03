import { WifiOff, RefreshCw } from "lucide-react";

import { useBackgroundSync } from "@/lib/use-background-sync";

/**
 * Slim, non-intrusive connectivity banner.
 *  • Offline → amber "you are offline" notice.
 *  • Just reconnected → brief "syncing…" notice that fades out.
 * Mounted once in __root.tsx so it shows across the whole app.
 */
export function OfflineIndicator() {
  const { isOnline, isSyncing } = useBackgroundSync();

  const show = !isOnline || isSyncing;
  const reconnecting = isOnline && isSyncing;

  return (
    <div
      aria-live="polite"
      aria-hidden={!show}
      className={[
        "fixed inset-x-0 top-11 z-[40] transition-all duration-300 ease-out",
        show ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0",
      ].join(" ")}
    >
      <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800">
        <div className="flex items-center gap-2">
          {reconnecting ? (
            <>
              <RefreshCw className="size-4 animate-spin" />
              Reconnected — syncing your data…
            </>
          ) : (
            <>
              <WifiOff className="size-4" />
              You are offline. Changes will sync automatically when you reconnect.
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default OfflineIndicator;
