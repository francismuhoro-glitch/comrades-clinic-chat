import { useEffect, useState } from "react";
import { PlusSquare, Share, X } from "lucide-react";

import { useIosPwaPrompt } from "../../lib/use-ios-pwa-prompt";

function Step({
  index,
  icon,
  children,
}: {
  index: number;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-semibold text-white">
        {index}
      </span>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-emerald-600">
        {icon}
      </span>
      <span className="text-sm leading-snug text-slate-700">{children}</span>
    </li>
  );
}

export function IosInstallPrompt() {
  const [mounted, setMounted] = useState(false);
  const { showPrompt, dismissPrompt } = useIosPwaPrompt();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !showPrompt) return null;

  return (
    <div
      role="dialog"
      aria-label="Install Comrades Clinic App"
      className="fixed inset-x-0 bottom-0 z-[100] flex justify-center px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]"
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-sm font-semibold text-slate-900">
            Install Comrades Clinic App on iPhone / iPad
          </h2>
          <button
            type="button"
            onClick={dismissPrompt}
            aria-label="Close install guide"
            className="-mr-1 -mt-1 rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
          Install this app on your home screen for instant access, instant notifications, and a
          full-screen app experience.
        </p>

        <ol className="mt-3 space-y-2">
          <Step index={1} icon={<Share className="h-4 w-4" />}>
            Tap the <span className="font-semibold text-slate-900">Share</span> button in Safari&apos;s
            bottom toolbar.
          </Step>
          <Step index={2} icon={<PlusSquare className="h-4 w-4" />}>
            Scroll down and tap{" "}
            <span className="font-semibold text-slate-900">&quot;Add to Home Screen&quot;</span>.
          </Step>
          <Step index={3} icon={<span className="text-xs font-semibold">Add</span>}>
            Tap <span className="font-semibold text-slate-900">&quot;Add&quot;</span> in the top right
            corner.
          </Step>
        </ol>

        <button
          type="button"
          onClick={dismissPrompt}
          className="mt-4 w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
        >
          Got it, thanks
        </button>
      </div>
    </div>
  );
}

export default IosInstallPrompt;
