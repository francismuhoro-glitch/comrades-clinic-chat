import { FlaskConical, Printer, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DOCTOR, type ConsultSession } from "@/lib/clinic-types";

function formatDate(iso: string | null) {
  return new Date(iso ?? Date.now()).toLocaleString("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function SheetShell({
  kicker,
  title,
  session,
  children,
}: {
  kicker: string;
  title: string;
  session: ConsultSession;
  children: React.ReactNode;
}) {
  return (
    <div className="print-sheet overflow-hidden rounded-2xl border bg-card shadow-card">
      <div className="bg-gradient-medical px-5 py-4 text-primary-foreground">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] opacity-85">
          {kicker}
        </p>
        <h3 className="mt-0.5 text-lg font-semibold">{title}</h3>
        <p className="mt-1 text-xs opacity-90">
          Lovable Student Clinic · Telemedicine Services
        </p>
      </div>

      <div className="space-y-4 px-5 py-5">
        <dl className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <dt className="text-muted-foreground">Patient</dt>
            <dd className="font-medium">{session.full_name}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Campus</dt>
            <dd className="font-medium">{session.campus}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Issued</dt>
            <dd className="font-medium">{formatDate(session.ended_at)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Ref. No.</dt>
            <dd className="font-medium uppercase">LSC-{session.id.slice(0, 6)}</dd>
          </div>
        </dl>

        {children}

        {session.diagnosis_notes && (
          <section>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Clinical notes
            </p>
            <p className="mt-1 text-sm leading-relaxed">{session.diagnosis_notes}</p>
          </section>
        )}

        {session.lab_test_requested && (
          <div className="flex items-start gap-2 rounded-xl bg-warning/15 px-3 py-2.5 text-xs text-warning-foreground">
            <FlaskConical className="mt-0.5 size-4 shrink-0" />
            <p>
              <strong>Lab test required.</strong> Present this document at the campus
              clinic laboratory for sample collection.
            </p>
          </div>
        )}

        <div className="flex items-end justify-between gap-4 border-t pt-4">
          <div>
            <p className="font-display text-sm italic text-primary">{DOCTOR.name}</p>
            <p className="text-xs text-muted-foreground">{DOCTOR.title}</p>
            {/* Hardcoded KMPDC placeholder — see DOCTOR in clinic-types.ts */}
            <p className="text-xs text-muted-foreground">
              KMPDC No. {DOCTOR.kmpdc_license}
            </p>
          </div>
          <span className="flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-1 text-[10px] font-semibold text-success">
            <ShieldCheck className="size-3" /> Digitally signed
          </span>
        </div>
      </div>
    </div>
  );
}

export function PrescriptionTemplate({ session }: { session: ConsultSession }) {
  const rx = session.prescription;
  if (!rx) return null;
  return (
    <SheetShell kicker="Digital prescription" title="Your Prescription (Rx)" session={session}>
      <div className="rounded-xl border border-dashed bg-secondary/60 px-4 py-3">
        <p className="font-display text-2xl text-primary">℞</p>
        <p className="mt-1 text-base font-semibold">{rx.medication}</p>
        <p className="mt-1 text-sm text-muted-foreground">Dosage: {rx.dosage}</p>
        <p className="text-sm text-muted-foreground">Duration: {rx.duration}</p>
      </div>
      <p className="text-xs text-muted-foreground">
        Present this prescription at any licensed pharmacy. Complete the full course
        even if you start feeling better.
      </p>
    </SheetShell>
  );
}

export function ReferralTemplate({ session }: { session: ConsultSession }) {
  const ref = session.referral;
  if (!ref) return null;
  return (
    <SheetShell kicker="Referral letter" title="Your Referral Letter" session={session}>
      <div className="rounded-xl border border-dashed bg-secondary/60 px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Referred to
        </p>
        <p className="mt-0.5 text-base font-semibold">{ref.destination}</p>
        <p className="mt-2 text-sm leading-relaxed">{ref.reason}</p>
      </div>
      <p className="text-xs text-muted-foreground">
        Kindly attend to the above patient. This consultation was conducted remotely
        via Lovable Student Clinic.
      </p>
    </SheetShell>
  );
}

export function DocumentActions({ label }: { label: string }) {
  return (
    <div className="no-print mt-3 flex gap-2">
      <Button variant="outline" className="flex-1" onClick={() => window.print()}>
        <Printer className="size-4" /> Download / print {label}
      </Button>
    </div>
  );
}
