import { Clock, FlaskConical, MessageSquare, Siren, Stethoscope, Video } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ConsultSession } from "@/lib/clinic-types";
import { symptomLabel } from "@/lib/triage";

function since(iso: string) {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  return mins < 1 ? "just now" : `${mins} min ago`;
}

export function PatientQueue({
  sessions,
  selectedId,
  onSelect,
  emptyLabel,
  actionLabel,
}: {
  sessions: ConsultSession[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  emptyLabel: string;
  actionLabel: string;
}) {
  if (sessions.length === 0) {
    return (
      <p className="rounded-xl border border-dashed bg-card px-4 py-8 text-center text-sm text-muted-foreground">
        {emptyLabel}
      </p>
    );
  }

  return (
    <ul className="space-y-2.5">
      {sessions.map((s) => (
        <li key={s.id}>
          <button
            onClick={() => onSelect(s.id)}
            className={cn(
              "w-full rounded-xl border bg-card p-3.5 text-left shadow-card transition-colors hover:border-primary/40",
              selectedId === s.id && "border-primary ring-1 ring-primary/30",
              s.emergency_flag && "border-destructive/60 bg-destructive/5",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold">{s.full_name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {s.campus} · {s.phone}
                </p>
              </div>
              <span className="flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground">
                <Clock className="size-3" /> {since(s.created_at)}
              </span>
            </div>

            {s.emergency_flag && (
              <p className="mt-2 flex items-center gap-1.5 rounded-lg bg-destructive/12 px-2 py-1 text-[11px] font-semibold text-destructive">
                <Siren className="size-3" /> Emergency triage — prioritise
              </p>
            )}

            {s.symptom_codes.length > 0 && (
              <p className="mt-2 text-[11px] font-medium text-muted-foreground">
                {s.symptom_codes.map(symptomLabel).join(" · ")}
              </p>
            )}

            <p className="mt-2 line-clamp-2 text-sm text-foreground/80">{s.symptoms}</p>

            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-semibold text-success">
                Paid KSh {s.fee_kes}
              </span>
              {s.consultation_mode === "video" && (
                <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  <Video className="size-2.5" /> Wants voice/video
                </span>
              )}
              {s.mpesa_receipt && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {s.mpesa_receipt}
                </span>
              )}
              {s.lab_test_requested && (
                <span className="flex items-center gap-1 rounded-full bg-warning/20 px-2 py-0.5 text-[10px] font-semibold text-warning-foreground">
                  <FlaskConical className="size-2.5" /> Needs sample collection
                </span>
              )}
              {s.prescription && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  Prescription issued
                </span>
              )}
              {s.referral && (
                <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-accent-foreground">
                  Referred
                </span>
              )}
              <span className="ml-auto flex items-center gap-1 text-[11px] font-semibold text-primary">
                {s.status === "completed" ? (
                  <Stethoscope className="size-3" />
                ) : (
                  <MessageSquare className="size-3" />
                )}
                {actionLabel}
              </span>
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}
