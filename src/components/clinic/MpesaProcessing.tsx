import { Loader2, Smartphone, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { CONSULT_FEE_KES } from "@/lib/clinic-types";

/**
 * Mock M-Pesa STK push screen. Replace `onSimulateSuccess` with a real
 * status poll / webhook subscription later.
 */
export function MpesaProcessing({
  phone,
  onSimulateSuccess,
  onCancel,
}: {
  phone: string;
  onSimulateSuccess: () => void;
  onCancel: () => void;
}) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border bg-card shadow-card">
      <div className="flex flex-col items-center gap-4 px-5 py-8 text-center">
        <span className="relative flex size-20 items-center justify-center rounded-full bg-success/12">
          <span className="absolute inset-0 animate-ping rounded-full bg-success/15" />
          <Smartphone className="size-9 text-success" />
        </span>

        <div>
          <h2 className="text-base font-semibold">M-Pesa payment request sent</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Sending KSh {CONSULT_FEE_KES} STK Push to{" "}
            <strong className="text-foreground">{phone}</strong>… Please check your phone and enter
            your PIN.
          </p>
        </div>

        <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" />
          Waiting for confirmation · {String(seconds).padStart(2, "0")}s
        </p>

        <div className="w-full space-y-2 pt-2">
          <Button className="h-12 w-full rounded-xl" onClick={onSimulateSuccess}>
            Simulate Successful Payment
          </Button>
          <Button variant="ghost" className="w-full text-muted-foreground" onClick={onCancel}>
            <X className="size-4" /> Cancel request
          </Button>
        </div>

        <p className="text-[11px] text-muted-foreground">
          Dev mock: no real money moves. Paybill 4001234 · Acc. LSC-CLINIC
        </p>
      </div>
    </div>
  );
}
