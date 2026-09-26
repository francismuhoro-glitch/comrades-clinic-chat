import { WifiOff, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

import { useBackgroundSync } from "@/lib/use-background-sync";

/**
 * Slim, non-intrusive connectivity banner.
 *  • Offline → amber "you are offline" notice.
 *  • Just reconnected → brief "syncing…" notice that fades out.
 * Mounted once in __root.tsx so it shows across the whole app.
 *
 * Renders NOTHING during SSR and while the visitor is online. Connectivity is a
 * browser-only fact, so rendering the banner server-side would put "You are
 * offline…" into the HTML of every page (crawlers read it as page content) and
 * cause a hydration mismatch for users who are in fact online.
 */
export function OfflineIndicator() {
  const [mounted, setMounted] = useState(false);
  const { isOnline, isSyncing } = useBackgroundSync();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Browser-only chrome: nothing to render on the server or before hydration.
  if (!mounted || (isOnline && !isSyncing)) return null;

  const reconnecting = isOnline && isSyncing;

  return (
    <div aria-live="polite" className="fixed inset-x-0 top-11 z-[40]">
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
