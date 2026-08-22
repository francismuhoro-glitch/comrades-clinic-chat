import { Activity, CheckCircle2, Clock, FlaskConical } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  LAB_RESULT_STAGES,
  LAB_RESULT_STAGE_LABELS,
  type LabResult,
  type LabResultFlag,
  type LabResultStage,
} from "@/lib/clinic-types";
import { cn } from "@/lib/utils";

function flagBadgeVariant(flag: LabResultFlag) {
  switch (flag) {
    case "critical":
      return "bg-destructive/15 text-destructive font-bold border-destructive/30";
    case "low":
    case "high":
      return "bg-warning/20 text-warning-foreground font-semibold border-warning/30";
    case "normal":
    default:
      return "bg-success/15 text-success font-medium border-success/30";
  }
}

function getStageStepIndex(stage: LabResultStage): number {
  return LAB_RESULT_STAGES.indexOf(stage);
}

export function LabResultsTracker({ results }: { results: LabResult[] }) {
  if (!results || results.length === 0) return null;

  return (
    <div className="rounded-2xl border bg-card p-4 shadow-card space-y-4">
      <div className="flex items-center justify-between border-b pb-2.5">
        <h3 className="text-sm font-bold flex items-center gap-2">
          <FlaskConical className="size-4 text-primary" />
          Laboratory Results Tracker
        </h3>
        <span className="text-[11px] text-muted-foreground font-medium">
          {results.length} test{results.length === 1 ? "" : "s"} ordered
        </span>
      </div>

      <div className="space-y-4">
        {results.map((r) => {
          const stepIndex = getStageStepIndex(r.stage);
          const isResultReady = r.stage === "resulted" || r.stage === "reviewed";

          return (
            <div
              key={r.id}
              className="rounded-xl border bg-background/50 p-3.5 space-y-3 transition-colors"
            >
              {/* Test Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-xs font-semibold text-foreground">
                    {r.panel || r.loinc_display || "Lab Test"}
                  </h4>
                  {r.loinc_code && (
                    <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                      LOINC: {r.loinc_code}
                    </p>
                  )}
                </div>

                {isResultReady ? (
                  <span
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 text-[10px] uppercase tracking-wide",
                      flagBadgeVariant(r.flag),
                    )}
                  >
                    {r.flag}
                  </span>
                ) : (
                  <Badge variant="outline" className="text-[10px] gap-1 font-normal">
                    <Clock className="size-3 text-warning animate-spin" />
                    In Progress
                  </Badge>
                )}
              </div>

              {/* Stage Progress Bar / Steps */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span className="font-medium text-foreground">
                    Stage: {LAB_RESULT_STAGE_LABELS[r.stage]}
                  </span>
                  <span>
                    Step {stepIndex + 1} of {LAB_RESULT_STAGES.length}
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-1">
                  {LAB_RESULT_STAGES.map((s, idx) => {
                    const isPassed = idx <= stepIndex;
                    const isCurrent = idx === stepIndex;

                    return (
                      <div
                        key={s}
                        className={cn(
                          "h-2 rounded-full transition-colors",
                          isCurrent
                            ? "bg-primary animate-pulse"
                            : isPassed
                              ? "bg-primary/80"
                              : "bg-muted",
                        )}
                        title={LAB_RESULT_STAGE_LABELS[s]}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Result Value Box (Only revealed if stage >= resulted) */}
              {isResultReady ? (
                <div className="rounded-lg border bg-card p-3 space-y-1 text-xs">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-muted-foreground text-[11px]">Value:</span>
                    <span className="font-bold text-sm text-foreground">
                      {r.result_value} {r.unit}
                    </span>
                  </div>
                  {r.reference_range && (
                    <div className="flex items-baseline justify-between gap-2 text-[11px]">
                      <span className="text-muted-foreground">Reference Range:</span>
                      <span className="font-mono text-muted-foreground">{r.reference_range}</span>
                    </div>
                  )}
                  {r.notes && (
                    <p className="mt-1 pt-1 border-t text-[11px] text-muted-foreground italic">
                      Notes: {r.notes}
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-lg bg-muted/40 p-2.5 text-[11px] text-muted-foreground">
                  <Activity className="size-3.5 text-muted-foreground shrink-0 animate-pulse" />
                  <span>
                    Sample is progressing through the lab pipeline. Values will reveal once results
                    are marked ready.
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
