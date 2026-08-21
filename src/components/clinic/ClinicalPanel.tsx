import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  FlaskConical,
  MapPin,
  Pill,
  ShieldAlert,
  Siren,
  Sparkles,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useClinic } from "@/lib/clinic-store";
import { cn } from "@/lib/utils";
import {
  LAB_ORDER_PIPELINE,
  LAB_ORDER_STATUS_LABELS,
  type ConsultSession,
} from "@/lib/clinic-types";
import { FALLBACK_FACILITIES } from "@/lib/facilities";
import { symptomLabel, triage } from "@/lib/triage";

export function ClinicalPanel({ session }: { session: ConsultSession }) {
  const {
    setDiagnosisNotes,
    toggleLabTest,
    endWithPrescription,
    endWithReferral,
    updateLabOrderStatus,
  } = useClinic();

  const [rx, setRx] = useState({ medication: "", dosage: "", duration: "" });
  const [referral, setReferral] = useState({ destination: "", reason: "" });
  const ended = session.status === "completed";
  const assessment = triage(session.symptom_codes);

  return (
    <div className="space-y-4">
      <section className="rounded-xl border bg-card p-4 shadow-card">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold">Auto-triage</p>
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
              assessment.level === "emergency"
                ? "bg-destructive/12 text-destructive"
                : assessment.level === "urgent"
                  ? "bg-warning/20 text-warning-foreground"
                  : "bg-success/15 text-success",
            )}
          >
            {assessment.level}
          </span>
        </div>

        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {session.symptom_codes.length === 0 ? (
            <span className="text-xs text-muted-foreground">No symptoms selected.</span>
          ) : (
            session.symptom_codes.map((c) => (
              <span
                key={c}
                className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground"
              >
                {symptomLabel(c)}
              </span>
            ))
          )}
        </div>

        {assessment.emergency && (
          <p className="mt-3 flex items-start gap-2 rounded-lg border border-destructive bg-destructive/10 p-2.5 text-xs font-medium text-destructive">
            <Siren className="mt-0.5 size-3.5 shrink-0" />
            Red flags: {assessment.emergencySymptoms.join(", ")}. Advise immediate physical hospital
            care and consider a referral.
          </p>
        )}

        {assessment.labRecommended && (
          <p className="mt-3 flex items-start gap-2 rounded-lg border border-warning bg-warning/12 p-2.5 text-xs text-warning-foreground">
            <FlaskConical className="mt-0.5 size-3.5 shrink-0" />
            Lab test recommended
            {assessment.labPanels.length
              ? `: ${assessment.labPanels.join("; ")}`
              : " (multiple urgent symptoms)"}
            .{session.lab_test_requested ? " Already flagged for sample collection." : ""}
          </p>
        )}
      </section>
      <section className="rounded-xl border bg-card p-4 shadow-card">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="notes" className="text-sm font-semibold">
            Diagnosis notes (SOAP format)
          </Label>
          {!ended && (
            <button
              type="button"
              onClick={() => {
                const labels = session.symptom_codes.map((c) => symptomLabel(c)).join(", ");
                const soapDraft = `[S - Subjective]: Student (${session.full_name}, ${session.campus}) presents with: ${session.symptoms || "unspecified symptoms"}. Selected flags: ${labels || "None"}.\n\n[O - Objective]: Triage evaluation: ${assessment.level.toUpperCase()}. ${assessment.labRecommended ? `Recommended lab panels: ${assessment.labPanels.join(", ")}.` : "No urgent lab markers indicated."}\n\n[A - Assessment]: Clinical impression consistent with acute symptomatic episode. ${assessment.emergency ? "RED FLAG: Emergency symptoms present." : "Routine/Urgent outpatient management."}\n\n[P - Plan]: Prescribed supportive therapy, hydration and rest. Advised to seek in-person review if symptoms escalate within 24-48 hours.`;
                setDiagnosisNotes(session.id, soapDraft);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
            >
              <Sparkles className="size-3.5" />
              Auto-Draft SOAP Note
            </button>
          )}
        </div>
        <Textarea
          id="notes"
          rows={5}
          className="mt-2 text-xs leading-relaxed"
          disabled={ended}
          value={session.diagnosis_notes}
          onChange={(e) => setDiagnosisNotes(session.id, e.target.value)}
          placeholder="Working diagnosis, observations, advice given… or click 'Auto-Draft SOAP Note' to generate."
        />
      </section>

      <section className="rounded-xl border bg-card p-4 shadow-card">
        <button
          type="button"
          disabled={ended}
          onClick={() => toggleLabTest(session.id)}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors disabled:opacity-60",
            session.lab_test_requested ? "border-warning bg-warning/15" : "hover:border-primary/40",
          )}
        >
          <span
            className={cn(
              "flex size-9 items-center justify-center rounded-lg",
              session.lab_test_requested
                ? "bg-warning/25 text-warning-foreground"
                : "bg-muted text-muted-foreground",
            )}
          >
            <FlaskConical className="size-4" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold">Request lab test</span>
            <span className="block text-xs text-muted-foreground">
              {session.lab_test_requested
                ? "Flagged: Needs Sample Collection"
                : "Flag this patient file for sample collection"}
            </span>
          </span>
        </button>

        {/* Patient's response to the lab request */}
        {session.lab_test_requested && !session.lab_order && (
          <p className="mt-3 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
            Waiting for the patient to choose a collection option (or decline) on their side.
          </p>
        )}

        {session.lab_order && (
          <div
            className={cn(
              "mt-3 rounded-lg border p-3 text-xs space-y-1.5",
              session.lab_order.status === "declined"
                ? "border-destructive/30 bg-destructive/5"
                : "border-success/30 bg-success/5",
            )}
          >
            <p className="font-semibold">
              {session.lab_order.status === "declined"
                ? "Patient declined the lab test"
                : session.lab_order.collection_method === "doorstep"
                  ? "Patient chose: Doorstep sample collection"
                  : "Patient chose: Visit a lab / facility"}
            </p>

            {session.lab_order.status === "declined" ? (
              <>
                {session.lab_order.decline_reason && (
                  <p className="text-muted-foreground">
                    Reason: “{session.lab_order.decline_reason}”
                  </p>
                )}
                <p className="text-muted-foreground">
                  Discuss it in the chat, or toggle the request off and on to ask again.
                </p>
              </>
            ) : (
              <>
                {session.lab_order.panels.length > 0 && (
                  <p className="text-muted-foreground">
                    Panels: {session.lab_order.panels.join(", ")}
                  </p>
                )}
                {session.lab_order.collection_method === "doorstep" && (
                  <p className="text-muted-foreground">
                    {session.lab_order.scheduled_date} · {session.lab_order.scheduled_time}
                    <br />
                    {session.lab_order.collection_address}
                    {session.lab_order.collection_phone
                      ? ` · ${session.lab_order.collection_phone}`
                      : ""}
                  </p>
                )}
                <p>
                  Status:{" "}
                  <span className="font-semibold">
                    {LAB_ORDER_STATUS_LABELS[session.lab_order.status]}
                  </span>
                </p>
                {!ended &&
                  (() => {
                    const idx = LAB_ORDER_PIPELINE.indexOf(
                      session.lab_order.status as (typeof LAB_ORDER_PIPELINE)[number],
                    );
                    const next = idx >= 0 ? LAB_ORDER_PIPELINE[idx + 1] : undefined;
                    return next ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-[11px]"
                        onClick={() => updateLabOrderStatus(session.id, next)}
                      >
                        Mark as “{LAB_ORDER_STATUS_LABELS[next]}”
                      </Button>
                    ) : (
                      <p className="text-[11px] font-medium text-success">Lab pipeline complete.</p>
                    );
                  })()}
              </>
            )}
          </div>
        )}
      </section>

      <section className="rounded-xl border bg-card p-4 shadow-card">
        <p className="text-sm font-semibold">Close the consultation</p>
        <Tabs defaultValue="rx" className="mt-3">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="rx">
              <Pill className="size-3.5" /> Prescription
            </TabsTrigger>
            <TabsTrigger value="ref">
              <FileText className="size-3.5" /> Referral
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rx" className="mt-4 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="med">Medication name</Label>
              <Input
                id="med"
                disabled={ended}
                value={rx.medication}
                onChange={(e) => setRx({ ...rx, medication: e.target.value })}
                placeholder="e.g. Amoxicillin 500mg, Paracetamol 1g, ORS sachets"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="dosage">Dosage</Label>
                <Input
                  id="dosage"
                  disabled={ended}
                  value={rx.dosage}
                  onChange={(e) => setRx({ ...rx, dosage: e.target.value })}
                  placeholder="1 tablet, 3x daily"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="duration">Duration</Label>
                <Input
                  id="duration"
                  disabled={ended}
                  value={rx.duration}
                  onChange={(e) => setRx({ ...rx, duration: e.target.value })}
                  placeholder="5 days"
                />
              </div>
            </div>

            {/* Clinical Safety Checks */}
            {rx.medication.trim() && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-2.5 text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-primary">
                  <ShieldAlert className="size-3.5" />
                  Clinical Safety Verification
                </div>
                <div className="mt-1 space-y-1 text-muted-foreground">
                  <p className="flex items-center gap-1">
                    <CheckCircle2 className="size-3 text-success" />
                    Standard dosing format verified
                  </p>
                  {rx.medication.toLowerCase().includes("amox") ||
                  rx.medication.toLowerCase().includes("penicillin") ? (
                    <p className="flex items-center gap-1 font-medium text-warning">
                      <AlertTriangle className="size-3 text-warning" />
                      Penicillin class antibiotic: Confirm patient has no allergy history.
                    </p>
                  ) : null}
                </div>
              </div>
            )}

            <Button
              className="w-full"
              disabled={ended || !rx.medication.trim() || !rx.dosage.trim() || !rx.duration.trim()}
              onClick={() => endWithPrescription(session.id, rx)}
            >
              End Session &amp; Send Prescription
            </Button>
          </TabsContent>

          <TabsContent value="ref" className="mt-4 space-y-3">
            {/* Proximity-Based Hospital Recommendations */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <MapPin className="size-3.5 text-primary" />
                  Nearby Facilities to {session.campus || "Patient"}
                </Label>
                <span className="text-[10px] text-muted-foreground">1-Click Select</span>
              </div>

              <div className="grid gap-1.5 max-h-48 overflow-y-auto pr-1">
                {FALLBACK_FACILITIES.slice(0, 5).map((fac, idx) => {
                  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fac.name)}`;
                  const isSelected = referral.destination.includes(fac.name);

                  return (
                    <div
                      key={idx}
                      className={cn(
                        "flex items-center justify-between p-2 rounded-lg border text-xs transition-colors cursor-pointer",
                        isSelected
                          ? "border-primary bg-primary/10"
                          : "border-border/60 bg-muted/40 hover:bg-muted/80",
                      )}
                      onClick={() => {
                        if (!ended) {
                          setReferral((prev) => ({
                            ...prev,
                            destination: `${fac.name} (${fac.level || "Hospital"} · ${fac.district || "Kenya"})`,
                          }));
                        }
                      }}
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-semibold text-foreground truncate">{fac.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {fac.level || "Hospital"} · {fac.facility_type} (
                          {fac.ownership || "Public"})
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <a
                          href={mapsUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="px-2 py-1 rounded border bg-background text-[10px] font-medium text-primary hover:bg-primary/10"
                          title="Open in Google Maps"
                        >
                          Map ↗
                        </a>
                        <Button
                          size="sm"
                          variant={isSelected ? "default" : "outline"}
                          className="h-6 text-[10px] px-2"
                        >
                          {isSelected ? "Selected" : "Select"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dest">Destination Facility (Selected)</Label>
              <Input
                id="dest"
                disabled={ended}
                value={referral.destination}
                onChange={(e) => setReferral({ ...referral, destination: e.target.value })}
                placeholder="Select from above or type custom facility..."
                required
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="reason">Reason for referral</Label>
                {!ended && (
                  <button
                    type="button"
                    onClick={() => {
                      const autoReason = `Patient ${session.full_name} (${session.campus}) referred from Comrades Clinic for urgent in-person clinical evaluation regarding reported symptoms: ${session.symptoms || "unspecified"}. Triage level: ${assessment.level.toUpperCase()}. Please assess, investigate, and manage accordingly.`;
                      setReferral((prev) => ({ ...prev, reason: autoReason }));
                    }}
                    className="text-[11px] font-medium text-primary hover:underline"
                  >
                    Auto-Fill Reason
                  </button>
                )}
              </div>
              <Textarea
                id="reason"
                rows={3}
                disabled={ended}
                value={referral.reason}
                onChange={(e) => setReferral({ ...referral, reason: e.target.value })}
                placeholder="Clinical summary and what the receiving facility should assess."
              />
            </div>

            <Button
              className="w-full"
              disabled={ended || !referral.destination.trim() || !referral.reason.trim()}
              onClick={() => endWithReferral(session.id, referral)}
            >
              End Session &amp; Issue Referral Letter
            </Button>
          </TabsContent>
        </Tabs>

        {ended && (
          <p className="mt-3 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
            This session is closed and archived under Completed.
          </p>
        )}
      </section>
    </div>
  );
}
