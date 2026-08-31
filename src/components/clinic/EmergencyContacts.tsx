import { Phone, ShieldAlert, Headset } from "lucide-react";
import { useClinic } from "@/lib/clinic-store";

const KENYA_EMERGENCY = [
  { number: "999", label: "Police", href: "tel:999" },
  { number: "112", label: "Emergency", href: "tel:112" },
  { number: "1199", label: "Red Cross", href: "tel:1199" },
  { number: "1190", label: "GBV Helpline", href: "tel:1190" },
  { number: "116", label: "Childline", href: "tel:116" },
  { number: "1195", label: "Mental Health", href: "tel:1195" },
] as const;

export function EmergencyContactsBar({
  variant = "footer",
}: {
  variant?: "banner" | "footer" | "compact" | "card";
}) {
  const { settings } = useClinic();
  const helpline = settings?.helpline_phone || "+254 712 345 678";
  const helplineHref = `tel:${helpline.replace(/\s/g, "")}`;

  if (variant === "banner") {
    return (
      <div className="w-full bg-destructive text-destructive-foreground px-3 py-2 text-[11px] sm:text-xs">
        <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          <span className="inline-flex items-center gap-1.5 font-bold">
            <ShieldAlert className="size-3.5" /> EMERGENCY:
          </span>
          <span className="flex flex-wrap items-center gap-2">
            {KENYA_EMERGENCY.map((e) => (
              <a
                key={e.number}
                href={e.href}
                className="font-bold underline underline-offset-2 hover:opacity-90"
              >
                {e.number}
              </a>
            ))}
          </span>
          <span className="hidden sm:inline">·</span>
          <span className="inline-flex items-center gap-1.5">
            <Headset className="size-3.5" />
            Enquiries:{" "}
            <a href={helplineHref} className="font-bold underline underline-offset-2">
              {helpline}
            </a>
          </span>
        </div>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-[11px]">
        <span className="inline-flex items-center gap-1 font-bold text-destructive">
          <Phone className="size-3" /> Help:
        </span>
        <a href={helplineHref} className="font-bold text-primary hover:underline">
          {helpline}
        </a>
        <span className="text-muted-foreground">· Emerg: 999/112/1199</span>
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div className="rounded-2xl border border-destructive/20 bg-card p-4 shadow-card space-y-3">
        <h3 className="flex items-center gap-2 text-sm font-bold">
          <ShieldAlert className="size-4 text-destructive" /> Emergency & Support Contacts
        </h3>
        <div className="rounded-xl bg-primary/5 p-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
            Clinic Helpline — For Enquiries
          </p>
          <a
            href={helplineHref}
            className="mt-1 inline-flex items-center gap-2 text-sm font-extrabold text-primary hover:underline"
          >
            <Headset className="size-4" /> {helpline} — Call for Enquiries
          </a>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Available during clinic hours for payment, bookings, prescriptions & general support.
          </p>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
            Kenya Emergency Numbers — 24/7 Free
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {KENYA_EMERGENCY.map((e) => (
              <a
                key={e.number}
                href={e.href}
                className="flex items-center justify-between rounded-xl border bg-muted/40 px-3 py-2 text-xs font-bold hover:border-primary/40 hover:bg-muted/60 transition-colors"
              >
                <span>{e.label}</span>
                <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-destructive">
                  {e.number}
                </span>
              </a>
            ))}
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground">
            If severe chest pain, heavy bleeding, difficulty breathing, or trauma — go to nearest
            hospital immediately. Do not wait for chat.
          </p>
        </div>
      </div>
    );
  }

  // footer variant — used in StudentLayout
  return (
    <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-3 text-[11px] leading-relaxed">
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5">
        <span className="inline-flex items-center gap-1.5 font-bold text-destructive">
          <Headset className="size-3.5" /> For enquiries call:
          <a href={helplineHref} className="underline underline-offset-2 hover:opacity-80">
            {helpline}
          </a>
        </span>
        <span className="hidden sm:inline text-muted-foreground">·</span>
        <span className="inline-flex flex-wrap items-center gap-1.5">
          <ShieldAlert className="size-3.5 text-destructive" />
          <span className="font-bold">Emergency:</span>
          {KENYA_EMERGENCY.map((e, i) => (
            <span key={e.number} className="inline-flex items-center gap-1">
              <a href={e.href} className="font-bold text-primary hover:underline">
                {e.number}
              </a>
              {i < KENYA_EMERGENCY.length - 1 && <span className="text-muted-foreground">·</span>}
            </span>
          ))}
        </span>
      </div>
    </div>
  );
}

// Simple inline version for headers
export function EmergencyInline() {
  const { settings } = useClinic();
  const helpline = settings?.helpline_phone || "+254 712 345 678";
  const helplineHref = `tel:${helpline.replace(/\s/g, "")}`;
  return (
    <a
      href={helplineHref}
      className="inline-flex items-center gap-1 rounded-full border bg-card px-2.5 py-1 text-[11px] font-bold text-primary hover:bg-primary/10"
    >
      <Phone className="size-3" /> {helpline}
    </a>
  );
}
