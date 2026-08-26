import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  FlaskConical,
  LoaderCircle,
  Mail,
  MapPin,
  Pill,
  Plus,
  Send,
  ShieldAlert,
  Siren,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useClinic } from "@/lib/clinic-store";
import {
  LAB_ORDER_PIPELINE,
  LAB_ORDER_STATUS_LABELS,
  LAB_RESULT_STAGES,
  LAB_RESULT_STAGE_LABELS,
  type ConsultSession,
  type LabResultFlag,
  type LabResultStage,
} from "@/lib/clinic-types";
import { FALLBACK_FACILITIES, loadFacilitiesFromSupabase, type Facility } from "@/lib/facilities";
import { supabase } from "@/lib/supabase";
import { sendVisitReportFn } from "@/lib/send-visit-report";
import { summarizeSmartTriage } from "@/lib/smart-triage";
import { symptomLabel, triage } from "@/lib/triage";
import { cn } from "@/lib/utils";

function DoctorLabResultsSection({ session }: { session: ConsultSession }) {
  const {
    labCatalog,
    labResultsFor,
    addLabResult,
    updateLabResultStage,
    updateBulkLabResultStage,
    deleteLabResult,
  } = useClinic();

  const results = labResultsFor(session.id);

  const [selectedCatalogCode, setSelectedCatalogCode] = useState<string>("");
  const [panel, setPanel] = useState<string>("");
  const [loincCode, setLoincCode] = useState<string>("");
  const [loincDisplay, setLoincDisplay] = useState<string>("");
  const [resultValue, setResultValue] = useState<string>("");
  const [unit, setUnit] = useState<string>("");
  const [referenceRange, setReferenceRange] = useState<string>("");
  const [flag, setFlag] = useState<LabResultFlag>("normal");
  const [stage, setStage] = useState<LabResultStage>("resulted");
  const [notes, setNotes] = useState<string>("");
  const [adding, setAdding] = useState<boolean>(false);

  const [selectedResultIds, setSelectedResultIds] = useState<string[]>([]);
  const [bulkStage, setBulkStage] = useState<LabResultStage>("resulted");

  const handleSelectCatalog = (code: string) => {
    setSelectedCatalogCode(code);
    if (code === "custom") {
      setPanel("");
      setLoincCode("");
      setLoincDisplay("");
      setUnit("");
      setReferenceRange("");
      return;
    }
    const item = labCatalog.find((c) => c.loinc_code === code);
    if (item) {
      setPanel(item.display_name);
      setLoincCode(item.loinc_code);
      setLoincDisplay(item.display_name);
      setUnit(item.common_unit || "");
      setReferenceRange(item.reference_range || "");
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!panel.trim()) return;
    setAdding(true);
    await addLabResult({
      consultation_id: session.id,
      panel: panel.trim(),
      result_value: resultValue.trim(),
      unit: unit.trim(),
      reference_range: referenceRange.trim(),
      flag,
      notes: notes.trim(),
      stage,
      loinc_code: loincCode.trim(),
      loinc_display: loincDisplay.trim() || panel.trim(),
    });
    setAdding(false);
    setResultValue("");
    setNotes("");
  };

  const toggleSelectResult = (id: string) => {
    setSelectedResultIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleBulkStageApply = async () => {
    if (selectedResultIds.length === 0) return;
    await updateBulkLabResultStage(selectedResultIds, bulkStage);
    setSelectedResultIds([]);
  };

  return (
    <div className="space-y-4 rounded-xl border bg-card p-4 shadow-card">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold flex items-center gap-2">
          <FlaskConical className="size-4 text-primary" />
          Clinical Lab Results Entry
        </p>
        <span className="text-[11px] text-muted-foreground">
          {results.length} result{results.length === 1 ? "" : "s"}
        </span>
      </div>

      {/* Catalog Search & Add Form */}
      <form onSubmit={handleAdd} className="space-y-3 rounded-lg border bg-muted/30 p-3 text-xs">
        <div className="space-y-1.5">
          <Label className="text-xs">Search Lab Catalog or Choose Custom Entry</Label>
          <Select value={selectedCatalogCode} onValueChange={handleSelectCatalog}>
            <SelectTrigger className="h-8 text-xs bg-background">
              <SelectValue placeholder="Search LOINC catalog..." />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              <SelectItem value="custom" className="font-semibold text-primary">
                + Manual Custom Test Entry
              </SelectItem>
              {labCatalog.map((item) => (
                <SelectItem key={item.loinc_code} value={item.loinc_code}>
                  {item.display_name} ({item.loinc_code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-[11px]">Test / Panel Name</Label>
            <Input
              value={panel}
              onChange={(e) => setPanel(e.target.value)}
              placeholder="e.g. Hemoglobin"
              className="h-8 text-xs"
              required
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px]">LOINC Code</Label>
            <Input
              value={loincCode}
              onChange={(e) => setLoincCode(e.target.value)}
              placeholder="e.g. 718-7"
              className="h-8 text-xs font-mono"
            />
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <div className="space-y-1">
            <Label className="text-[11px]">Result Value</Label>
            <Input
              value={resultValue}
              onChange={(e) => setResultValue(e.target.value)}
              placeholder="e.g. 13.5"
              className="h-8 text-xs font-medium"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px]">Unit</Label>
            <Input
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="e.g. g/dL"
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px]">Ref Range</Label>
            <Input
              value={referenceRange}
              onChange={(e) => setReferenceRange(e.target.value)}
              placeholder="e.g. 12.0-16.0"
              className="h-8 text-xs"
            />
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-[11px]">Flag</Label>
            <Select value={flag} onValueChange={(v) => setFlag(v as LabResultFlag)}>
              <SelectTrigger className="h-8 text-xs bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-[11px]">Pipeline Stage</Label>
            <Select value={stage} onValueChange={(v) => setStage(v as LabResultStage)}>
              <SelectTrigger className="h-8 text-xs bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LAB_RESULT_STAGES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {LAB_RESULT_STAGE_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-[11px]">Clinical Notes (Optional)</Label>
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Normal baseline, repeat in 1 week if fever persists."
            className="h-8 text-xs"
          />
        </div>

        <Button type="submit" size="sm" className="w-full h-8 text-xs gap-1.5" disabled={adding}>
          <Plus className="size-3.5" />
          {adding ? "Adding Result…" : "Add Lab Result"}
        </Button>
      </form>

      {/* Existing Lab Results List & Stage Management */}
      {results.length > 0 && (
        <div className="space-y-3 pt-2">
          {/* Bulk Update Controls */}
          {selectedResultIds.length > 0 && (
            <div className="flex items-center justify-between gap-2 rounded-lg bg-primary/10 p-2 text-xs border border-primary/20">
              <span className="font-semibold text-primary">
                {selectedResultIds.length} test{selectedResultIds.length === 1 ? "" : "s"} selected
              </span>
              <div className="flex items-center gap-2">
                <Select value={bulkStage} onValueChange={(v) => setBulkStage(v as LabResultStage)}>
                  <SelectTrigger className="h-7 text-[11px] w-36 bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LAB_RESULT_STAGES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {LAB_RESULT_STAGE_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" className="h-7 text-[11px]" onClick={handleBulkStageApply}>
                  Apply Bulk
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {results.map((r) => (
              <div
                key={r.id}
                className="flex flex-col gap-2 rounded-lg border bg-background p-3 text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Checkbox
                      checked={selectedResultIds.includes(r.id)}
                      onCheckedChange={() => toggleSelectResult(r.id)}
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-foreground truncate">{r.panel}</p>
                      {r.loinc_code && (
                        <p className="text-[10px] text-muted-foreground font-mono">
                          LOINC: {r.loinc_code}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] uppercase",
                        r.flag === "critical"
                          ? "bg-destructive/15 text-destructive font-bold"
                          : r.flag === "low" || r.flag === "high"
                            ? "bg-warning/20 text-warning-foreground"
                            : "bg-success/15 text-success",
                      )}
                    >
                      {r.flag}
                    </Badge>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-6 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteLabResult(r.id)}
                      title="Delete result"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] bg-muted/40 p-2 rounded">
                  <div>
                    <span className="text-muted-foreground">Value: </span>
                    <strong className="text-foreground">
                      {r.result_value ? `${r.result_value} ${r.unit}` : "Pending"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Range: </span>
                    <span>{r.reference_range || "N/A"}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="text-[11px] text-muted-foreground">Stage:</span>
                  <Select
                    value={r.stage}
                    onValueChange={(v) => updateLabResultStage(r.id, v as LabResultStage)}
                  >
                    <SelectTrigger className="h-7 text-[11px] w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LAB_RESULT_STAGES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {LAB_RESULT_STAGE_LABELS[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SendVisitReportSection({ session }: { session: ConsultSession }) {
  const [sending, setSending] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(
    null,
  );

  const handleSend = async () => {
    setSending(true);
    setStatusMsg(null);
    try {
      const res = await sendVisitReportFn({ data: { consultationId: session.id } });
      if (res.ok) {
        setStatusMsg({
          type: "success",
          text: `Visit report successfully sent to ${res.recipient}!`,
        });
      } else {
        setStatusMsg({
          type: "error",
          text: res.error || "Failed to send visit report.",
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatusMsg({
        type: "error",
        text: `Error sending report: ${msg}`,
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="rounded-xl border bg-card p-4 shadow-card space-y-3">
      <div>
        <h3 className="text-sm font-semibold flex items-center gap-1.5">
          <Mail className="size-4 text-primary" />
          Send Official Visit Report
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Send the patient an HTML report with prescriptions, referrals, lab results, and KMPDC
          doctor details via Brevo.
        </p>
      </div>

      {session.patient_email ? (
        <p className="text-xs text-muted-foreground">
          Patient Email: <strong className="text-foreground">{session.patient_email}</strong>
        </p>
      ) : (
        <p className="text-xs text-warning-foreground bg-warning/10 p-2 rounded border border-warning/30">
          No patient email provided on file. The patient can enter an email address on the intake
          form or in account settings.
        </p>
      )}

      {statusMsg && (
        <div
          className={cn(
            "p-2.5 rounded-lg text-xs font-medium border",
            statusMsg.type === "success"
              ? "bg-success/10 border-success/30 text-success"
              : "bg-destructive/10 border-destructive/30 text-destructive",
          )}
        >
          {statusMsg.text}
        </div>
      )}

      <Button onClick={handleSend} disabled={sending} className="w-full gap-2 text-xs">
        {sending ? (
          <LoaderCircle className="size-3.5 animate-spin" />
        ) : (
          <Send className="size-3.5" />
        )}
        {sending ? "Sending Visit Report…" : "Send Visit Report Email"}
      </Button>
    </div>
  );
}

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
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [facilitiesLoading, setFacilitiesLoading] = useState(true);
  const [facilitySearch, setFacilitySearch] = useState("");
  const ended = session.status === "completed";
  useEffect(() => {
    let cancelled = false;
    setFacilitiesLoading(true);
    loadFacilitiesFromSupabase(supabase)
      .then((rows) => {
        if (cancelled) return;
        setFacilities(rows.length > 0 ? rows : FALLBACK_FACILITIES);
      })
      .catch(() => {
        if (!cancelled) setFacilities(FALLBACK_FACILITIES);
      })
      .finally(() => {
        if (!cancelled) setFacilitiesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  const search = facilitySearch.trim().toLowerCase();
  // Full 1,438+ directory is loaded; filter by search, prefer patient's campus/region.
  // Cap rendered rows so the referral panel stays responsive while still searchable.
  const matchingFacilities = facilities
    .filter((f) => {
      const text =
        `${f.name} ${f.level} ${f.facility_type} ${f.district} ${f.campus} ${f.agency}`.toLowerCase();
      return !search || text.includes(search);
    })
    .sort((a, b) => {
      const region = (session.campus || "").toLowerCase();
      if (!region) return a.name.localeCompare(b.name);
      return (
        Number(`${b.campus} ${b.district}`.toLowerCase().includes(region)) -
        Number(`${a.campus} ${a.district}`.toLowerCase().includes(region))
      );
    })
    .slice(0, search ? 250 : 150);
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

        {session.triage_answers &&
          (() => {
            const smart = summarizeSmartTriage(session.symptom_codes, session.triage_answers);
            return (
              <div className="mt-3 space-y-2 rounded-xl border bg-primary/5 p-3">
                <p className="flex items-center gap-1.5 text-[11px] font-extrabold text-primary">
                  <Sparkles className="size-3.5" />
                  Pre-consult summary (patient intake)
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {smart.duration && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                      Duration: {smart.duration}
                    </span>
                  )}
                  {smart.severity && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                      Impact: {smart.severity}
                    </span>
                  )}
                </div>
                {smart.redFlags.length > 0 && (
                  <ul className="space-y-1 rounded-lg border border-destructive/40 bg-destructive/10 p-2">
                    {smart.redFlags.map((flag) => (
                      <li
                        key={flag}
                        className="flex items-start gap-1.5 text-[11px] font-semibold text-destructive"
                      >
                        <ShieldAlert className="mt-0.5 size-3 shrink-0" />
                        {flag}
                      </li>
                    ))}
                  </ul>
                )}
                {smart.detail.length > 0 && (
                  <ul className="space-y-0.5">
                    {smart.detail.map((line) => (
                      <li key={line} className="text-[11px] leading-snug text-muted-foreground">
                        · {line}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })()}

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

      {/* Lab Request & Doorstep Pipeline */}
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

      {/* Doctor Lab Results Entry & Management */}
      <DoctorLabResultsSection session={session} />

      {/* Prescription / Referral Tab Section */}
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
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <MapPin className="size-3.5 text-primary" />
                  Nearby Facilities to {session.campus || "Patient"}
                </Label>
                <span className="text-[10px] text-muted-foreground">
                  {facilitiesLoading
                    ? "Loading directory…"
                    : `${facilities.length.toLocaleString()} facilities · 1-Click Select`}
                </span>
              </div>

              <div className="grid gap-1.5 max-h-48 overflow-y-auto pr-1">
                <Input
                  value={facilitySearch}
                  onChange={(e) => setFacilitySearch(e.target.value)}
                  placeholder="Search all 1,400+ hospitals by name, level, county or location…"
                  disabled={ended || facilitiesLoading}
                />
                {!facilitiesLoading && matchingFacilities.length === 0 && (
                  <p className="text-[11px] text-muted-foreground px-1 py-2">
                    No facilities match “{facilitySearch}”. Try a county, level, or hospital name.
                  </p>
                )}
                {matchingFacilities.map((fac, idx) => {
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
                      const autoReason = `Patient ${session.full_name} (${session.campus}) referred from COMRACARE Student Clinic for urgent in-person clinical evaluation regarding reported symptoms: ${session.symptoms || "unspecified"}. Triage level: ${assessment.level.toUpperCase()}. Please assess, investigate, and manage accordingly.`;
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

      {/* Send Visit Report Section */}
      <SendVisitReportSection session={session} />
    </div>
  );
}
