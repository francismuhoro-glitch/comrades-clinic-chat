import { useState } from "react";
import { Loader2, Landmark, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CONSULT_FEE_KES } from "@/lib/clinic-types";
import { useClinic } from "@/lib/clinic-store";

export function MpesaProcessing({
  phone,
  onCancel,
}: {
  phone: string;
  onSimulateSuccess: () => void;
  onCancel: () => void;
}) {
  const { submitPaymentClaim, studentSessionId, settings } = useClinic();
  const [refCode, setRefCode] = useState("");
  const [payPhone, setPaymentPhone] = useState(phone);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pochiPhone = settings?.pochi_phone || "0712345678";
  const pochiName = settings?.pochi_name || "COMRADES CLINIC";
  const helpline = settings?.helpline_phone || "+254 712 345 678";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanRef = refCode.trim().toUpperCase();
    if (cleanRef.length < 8 || cleanRef.length > 12) {
      setError("Please enter a valid M-Pesa reference code (e.g. SFI89G7H7H).");
      return;
    }

    if (!studentSessionId) {
      setError("Active session not found. Please try again.");
      return;
    }

    setSubmitted(true);
    await submitPaymentClaim(studentSessionId, cleanRef, payPhone);
  };

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border bg-card shadow-card">
      <div className="px-5 py-6">
        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col items-center gap-2 text-center pb-2">
              <span className="flex size-14 items-center justify-center rounded-full bg-success/10 text-success">
                <Landmark className="size-7" />
              </span>
              <h2 className="text-base font-semibold">Payment via Pochi la Biashara</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                To consult the doctor, please send exactly{" "}
                <strong className="text-foreground">KSh {CONSULT_FEE_KES}</strong> to the Pochi
                details below:
              </p>
            </div>

            {/* Payment Details Card */}
            <div className="rounded-xl bg-muted/60 p-3.5 text-xs space-y-2 border border-border">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pochi Phone Number:</span>
                <strong className="text-foreground select-all">{pochiPhone}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Recipient Name:</span>
                <strong className="text-foreground">{pochiName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount to Send:</span>
                <strong className="text-foreground font-semibold">KSh {CONSULT_FEE_KES}</strong>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="refCode">M-Pesa Reference Code</Label>
                <Input
                  id="refCode"
                  placeholder="e.g. SFI89G7H7H"
                  value={refCode}
                  onChange={(e) => setRefCode(e.target.value)}
                  className="uppercase"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="payPhone">Your M-Pesa Phone Number</Label>
                <Input
                  id="payPhone"
                  type="tel"
                  placeholder="e.g. 0712345678"
                  value={payPhone}
                  onChange={(e) => setPaymentPhone(e.target.value)}
                  required
                />
              </div>
            </div>

            {error && (
              <p className="flex items-center gap-1.5 text-xs font-medium text-destructive">
                <AlertCircle className="size-4" /> {error}
              </p>
            )}

            <div className="space-y-2 pt-1">
              <Button type="submit" className="w-full h-11 rounded-xl">
                Submit Reference Code
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full text-xs text-muted-foreground"
                onClick={onCancel}
              >
                Cancel intake
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-warning/10 text-warning animate-pulse">
              <Loader2 className="size-7 animate-spin" />
            </span>
            <div>
              <h3 className="text-base font-semibold">Verifying Your Payment</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground max-w-sm">
                We have received reference code{" "}
                <strong className="text-foreground uppercase">{refCode}</strong>. The clinic is
                reviewing M-Pesa statements to confirm. Your dashboard will unlock automatically.
              </p>
            </div>

            {/* Helpline Callout */}
            <div className="w-full rounded-xl border border-dashed border-warning/40 bg-warning/5 p-4 text-xs">
              <p className="font-semibold text-warning-foreground">Delayed verification?</p>
              <p className="mt-1 text-muted-foreground text-left">
                If confirmation takes longer than 5 minutes, please call support:
              </p>
              <a
                href={`tel:${helpline}`}
                className="mt-2 inline-flex items-center gap-1.5 font-bold text-primary hover:underline text-sm"
              >
                📞 {helpline}
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
