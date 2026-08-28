import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FlaskConical,
  Mail,
  MessageSquare,
  ShieldCheck,
  Siren,
  Stethoscope,
  UserRound,
  Video,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { KENYAN_INSTITUTIONS } from "@/lib/kenya-institutions";
import { NearbyFacilities } from "./NearbyFacilities";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useClinic, type IntakeInput } from "@/lib/clinic-store";
import { CONSULT_FEE_KES } from "@/lib/clinic-types";
import { usePatientAuth } from "@/lib/patient-auth";
import { questionsFor, summarizeSmartTriage, type SmartTriageAnswers } from "@/lib/smart-triage";
import { EMERGENCY_NOTICE, SYMPTOM_OPTIONS, symptomLabel, triage } from "@/lib/triage";
import { cn } from "@/lib/utils";
import { consumeIntakeSymptoms } from "@/lib/wellness";
import type { LucideIcon } from "lucide-react";

/** Numbered, carded step that gives the form a clear visual rhythm. */
function Section({
  step,
  icon: Icon,
  title,
  hint,
  children,
}: {
  step: number;
  icon: LucideIcon;
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-2xl border bg-card p-4 shadow-card">
      <header className="flex items-center gap-2.5">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
          {step}
        </span>
        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4" />
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-bold leading-tight">{title}</h3>
          <p className="text-[11px] leading-snug text-muted-foreground">{hint}</p>
        </div>
      </header>
      {children}
    </section>
  );
}

export function IntakeForm({ onSubmit }: { onSubmit: (input: IntakeInput) => void }) {
  const { doctorOnline } = useClinic();
  const { patient } = usePatientAuth();

  const [form, setForm] = useState<IntakeInput>({
    full_name: "",
    phone: "",
    patient_email: "",
    campus: "",
    symptoms: "",
    symptom_codes: [],
    consultation_mode: "chat",
  });
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [smartAnswers, setSmartAnswers] = useState<SmartTriageAnswers>({});

  // Auto-prefill email if patient is signed in
  useEffect(() => {
    if (patient?.email && !form.patient_email) {
      setForm((f) => ({ ...f, patient_email: patient.email ?? "" }));
    }
  }, [patient, form.patient_email]);

  // Preselect symptoms handed over by the mood check-in / Wellness Hub.
  useEffect(() => {
    const preselect = consumeIntakeSymptoms();
    if (preselect.length > 0) {
      setForm((f) => ({
        ...f,
        symptom_codes: [...new Set([...f.symptom_codes, ...preselect])],
      }));
    }
  }, []);

  const set = <K extends keyof IntakeInput>(key: K, value: IntakeInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const assessment = triage(form.symptom_codes);

  const toggleSymptom = (code: string) =>
    setForm((f) => ({
      ...f,
      symptom_codes: f.symptom_codes.includes(code)
        ? f.symptom_codes.filter((c) => c !== code)
        : [...f.symptom_codes, code],
    }));

  // Drop answers for questions that no longer apply (symptom deselected).
  useEffect(() => {
    setSmartAnswers((prev) => {
      const applicable = new Set(questionsFor(form.symptom_codes).map((q) => q.id));
      const next = Object.fromEntries(Object.entries(prev).filter(([id]) => applicable.has(id)));
      return Object.keys(next).length === Object.keys(prev).length ? prev : next;
    });
  }, [form.symptom_codes]);

  const smartQuestions = questionsFor(form.symptom_codes);
  const smartSummary = summarizeSmartTriage(form.symptom_codes, smartAnswers);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim() || !form.phone.trim() || !form.campus || !form.symptoms.trim()) {
      setError("Please fill in all the required fields above.");
      return;
    }
    if (!/^(?:\+?254|0)7\d{8}$|^(?:\+?254|0)1\d{8}$/.test(form.phone.replace(/\\s/g, ""))) {
      setError("Enter a valid Kenyan M-Pesa number, e.g. 0712345678.");
      return;
    }
    if (
      form.patient_email?.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.patient_email.trim())
    ) {
      setError("Enter a valid email address.");
      return;
    }
    if (form.symptom_codes.length === 0) {
      setError("Select at least one symptom so we can triage your case.");
      return;
    }
    if (smartQuestions.some((q) => !smartAnswers[q.id])) {
      setError("Please answer the quick questions so the doctor gets the full picture.");
      return;
    }
    if (!agreed) {
      setError("Please accept the medical disclaimer to continue.");
      return;
    }
    setError(null);
    onSubmit({
      ...form,
      ...(Object.keys(smartAnswers).length > 0 ? { triage_answers: smartAnswers } : {}),
    });
  };

  const commonSymptoms = SYMPTOM_OPTIONS.filter((s) => s.level !== "emergency");
  const emergencySymptoms = SYMPTOM_OPTIONS.filter((s) => s.level === "emergency");

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* ── Step 1 · Your details ───────────────────────────────────────── */}
      <Section
        step={1}
        icon={UserRound}
        title="Your details"
        hint="So we can identify you and reach you about this consultation."
      >
        <div className="space-y-1.5">
          <Label htmlFor="full_name">Full name</Label>
          <Input
            id="full_name"
            value={form.full_name}
            onChange={(e) => set("full_name", e.target.value)}
            placeholder="e.g. Brian Otieno"
            autoComplete="name"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone number (M-Pesa)</Label>
          <Input
            id="phone"
            type="tel"
            inputMode="tel"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="07XX XXX XXX"
            autoComplete="tel"
            required
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="patient_email">Email address (optional)</Label>
            {patient?.email && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Mail className="size-3 text-primary" /> Auto-attached from account
              </span>
            )}
          </div>
          <Input
            id="patient_email"
            type="email"
            value={form.patient_email || ""}
            onChange={(e) => set("patient_email", e.target.value)}
            placeholder="e.g. comrade@students.ku.ac.ke"
            autoComplete="email"
          />
          <p className="text-[10px] text-muted-foreground">
            Used to send you your official visit report with prescriptions and lab results.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="campus">Institution / Campus / TVET / College</Label>
          <Select value={form.campus} onValueChange={(v) => set("campus", v)}>
            <SelectTrigger id="campus" className="w-full">
              <SelectValue placeholder="Select your institution..." />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              <div className="px-2 py-1.5 text-xs font-bold text-primary">Public Universities</div>
              {KENYAN_INSTITUTIONS.filter((u) => u.category === "public_uni").map((u) => (
                <SelectItem key={u.name} value={u.name}>
                  {u.name} ({u.region})
                </SelectItem>
              ))}

              <div className="px-2 py-1.5 text-xs font-bold text-primary">Private Universities</div>
              {KENYAN_INSTITUTIONS.filter((u) => u.category === "private_uni").map((u) => (
                <SelectItem key={u.name} value={u.name}>
                  {u.name} ({u.region})
                </SelectItem>
              ))}

              <div className="px-2 py-1.5 text-xs font-bold text-primary">
                National Polytechnics
              </div>
              {KENYAN_INSTITUTIONS.filter((u) => u.category === "national_poly").map((u) => (
                <SelectItem key={u.name} value={u.name}>
                  {u.name} ({u.region})
                </SelectItem>
              ))}

              <div className="px-2 py-1.5 text-xs font-bold text-primary">
                TVETs, Colleges &amp; Institutes
              </div>
              {KENYAN_INSTITUTIONS.filter(
                (u) =>
                  u.category === "tvet" ||
                  u.category === "college" ||
                  u.category === "proprietary" ||
                  u.category === "specialized",
              ).map((u) => (
                <SelectItem key={u.name} value={u.name}>
                  {u.name} ({u.region})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Section>

      {/* ── Step 2 · Your symptoms ──────────────────────────────────────── */}
      <Section
        step={2}
        icon={Stethoscope}
        title="Your symptoms"
        hint="Pick at least one from the dropdown — it powers automatic triage."
      >
        <div className="space-y-1.5">
          <Label htmlFor="symptom_picker">Choose a symptom</Label>
          <Select
            value=""
            onValueChange={(code) => {
              if (!form.symptom_codes.includes(code)) toggleSymptom(code);
            }}
          >
            <SelectTrigger id="symptom_picker" className="w-full">
              <SelectValue
                placeholder={
                  form.symptom_codes.length ? "+ Add another symptom…" : "Select a symptom…"
                }
              />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectGroup>
                <SelectLabel>Common symptoms</SelectLabel>
                {commonSymptoms.map((s) => {
                  const picked = form.symptom_codes.includes(s.code);
                  return (
                    <SelectItem key={s.code} value={s.code} disabled={picked}>
                      <span className="flex items-center gap-2">
                        {picked && <CheckCircle2 className="size-3.5 text-primary" />}
                        {s.label}
                        {picked && (
                          <span className="text-[10px] text-muted-foreground">selected</span>
                        )}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectGroup>
              <SelectGroup>
                <SelectLabel className="text-destructive">Urgent — treat as emergency</SelectLabel>
                {emergencySymptoms.map((s) => {
                  const picked = form.symptom_codes.includes(s.code);
                  return (
                    <SelectItem key={s.code} value={s.code} disabled={picked}>
                      <span className="flex items-center gap-2">
                        {picked && <CheckCircle2 className="size-3.5 text-primary" />}
                        {s.label}
                        {picked && (
                          <span className="text-[10px] text-muted-foreground">selected</span>
                        )}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {/* Selected symptoms as removable chips */}
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold text-muted-foreground">
            Selected ({form.symptom_codes.length}) — tap ✕ to remove
          </p>
          {form.symptom_codes.length === 0 ? (
            <p className="rounded-lg border border-dashed px-3 py-2 text-xs text-muted-foreground">
              No symptoms selected yet. Use the dropdown above to add one.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {form.symptom_codes.map((code) => (
                <span
                  key={code}
                  className="flex items-center gap-1 rounded-full bg-primary py-1 pl-3 pr-1.5 text-xs font-bold text-primary-foreground"
                >
                  {symptomLabel(code)}
                  <button
                    type="button"
                    aria-label={`Remove ${symptomLabel(code)}`}
                    onClick={() => toggleSymptom(code)}
                    className="flex size-4 items-center justify-center rounded-full bg-primary-foreground/20 transition-colors hover:bg-primary-foreground/40"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {assessment.emergency && (
          <div className="space-y-3">
            <div className="flex items-start gap-2 rounded-xl border border-destructive bg-destructive/10 p-3 text-xs font-medium text-destructive">
              <Siren className="mt-0.5 size-4 shrink-0" />
              <span>
                <strong className="block">Emergency warning</strong>
                {EMERGENCY_NOTICE}
              </span>
            </div>
            <NearbyFacilities campus={form.campus} onlyEmergency={true} />
          </div>
        )}

        {!assessment.emergency && assessment.labRecommended && (
          <p className="flex items-start gap-2 rounded-xl border border-warning bg-warning/12 p-3 text-xs text-warning-foreground">
            <FlaskConical className="mt-0.5 size-3.5 shrink-0" />
            <span>
              A lab test will likely be needed
              {assessment.labPanels.length ? `: ${assessment.labPanels.join("; ")}` : ""}. The
              doctor confirms this in your consultation.
            </span>
          </p>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="symptoms">Describe your symptoms or reason for visit</Label>
          <Textarea
            id="symptoms"
            rows={4}
            value={form.symptoms}
            onChange={(e) => set("symptoms", e.target.value)}
            placeholder="Tell the doctor what you are feeling, for how long, and any medication you have taken."
            required
          />
        </div>
      </Section>

      {/* ── Step 3 · Quick questions (smart triage) ─────────────────────── */}
      {smartQuestions.length > 0 && (
        <Section
          step={3}
          icon={Siren}
          title="A few quick questions"
          hint="30 seconds — this tells the doctor how urgent things are before the chat even starts."
        >
          {smartSummary.redFlags.length > 0 && (
            <p className="mb-3 flex items-start gap-2 rounded-lg border border-destructive bg-destructive/10 p-2.5 text-[11px] font-semibold text-destructive">
              <Siren className="mt-0.5 size-3.5 shrink-0" />
              One of your answers is an emergency sign. The doctor will prioritise you — but if
              things are severe right now, go to the nearest hospital or call 999 / 112.
            </p>
          )}
          <div className="space-y-3.5">
            {smartQuestions.map((q) => (
              <div key={q.id} className="space-y-1.5">
                <p className="text-xs font-bold leading-snug">{q.question}</p>
                {q.hint && <p className="text-[10px] text-muted-foreground">{q.hint}</p>}
                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  {q.options.map((option) => {
                    const active = smartAnswers[q.id] === option.label;
                    return (
                      <button
                        key={option.label}
                        type="button"
                        onClick={() =>
                          setSmartAnswers((prev) => ({ ...prev, [q.id]: option.label }))
                        }
                        className={cn(
                          "rounded-xl border px-2.5 py-1.5 text-left text-[11px] font-semibold transition-colors",
                          active
                            ? option.redFlag
                              ? "border-destructive bg-destructive text-white shadow-sm"
                              : "border-primary bg-primary text-primary-foreground shadow-sm"
                            : "bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
                        )}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section
        step={4}
        icon={Video}
        title="How would you like to consult?"
        hint="Chat is always available either way — this tells the doctor your preference."
      >
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            aria-pressed={form.consultation_mode === "chat"}
            onClick={() => set("consultation_mode", "chat")}
            className={cn(
              "relative space-y-1 rounded-xl border-2 p-3 text-left transition-colors",
              form.consultation_mode === "chat"
                ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                : "bg-card hover:border-primary/40",
            )}
          >
            {form.consultation_mode === "chat" && (
              <CheckCircle2 className="absolute right-2 top-2 size-4 text-primary" />
            )}
            <MessageSquare
              className={cn(
                "size-4",
                form.consultation_mode === "chat" ? "text-primary" : "text-muted-foreground",
              )}
            />
            <span
              className={cn(
                "block text-xs font-bold",
                form.consultation_mode === "chat" ? "text-primary" : "text-foreground",
              )}
            >
              Text chat
            </span>
            <span className="block text-[10px] leading-relaxed text-muted-foreground">
              Encrypted in-app messaging with the doctor.
            </span>
          </button>
          <button
            type="button"
            aria-pressed={form.consultation_mode === "video"}
            onClick={() => set("consultation_mode", "video")}
            className={cn(
              "relative space-y-1 rounded-xl border-2 p-3 text-left transition-colors",
              form.consultation_mode === "video"
                ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                : "bg-card hover:border-primary/40",
            )}
          >
            {form.consultation_mode === "video" && (
              <CheckCircle2 className="absolute right-2 top-2 size-4 text-primary" />
            )}
            <Video
              className={cn(
                "size-4",
                form.consultation_mode === "video" ? "text-primary" : "text-muted-foreground",
              )}
            />
            <span
              className={cn(
                "block text-xs font-bold",
                form.consultation_mode === "video" ? "text-primary" : "text-foreground",
              )}
            >
              Voice/video call
            </span>
            <span className="block text-[10px] leading-relaxed text-muted-foreground">
              Audio-first call — camera stays off until you turn it on.
            </span>
          </button>
        </div>
      </Section>

      {/* Disclaimer + submit */}
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border bg-secondary/50 p-3">
        <Checkbox
          checked={agreed}
          onCheckedChange={(v) => setAgreed(v === true)}
          className="mt-0.5"
        />
        <span className="text-xs leading-relaxed text-secondary-foreground">
          I understand this service is for basic care only. For emergencies, I will visit a physical
          hospital immediately.
        </span>
      </label>

      {error && (
        <p className="flex items-center gap-2 text-xs font-medium text-destructive">
          <AlertTriangle className="size-3.5" /> {error}
        </p>
      )}

      <Button type="submit" size="lg" className="h-14 w-full rounded-xl gap-2 text-base font-bold">
        Start Consultation (KSh {CONSULT_FEE_KES}) <ArrowRight className="size-4" />
      </Button>

      <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
        <ShieldCheck className="size-3.5 text-success" />
        Paid securely via Pochi la Biashara · Private &amp; confidential
      </p>

      {!doctorOnline && (
        <p className="text-center text-[11px] text-muted-foreground">
          The doctor is offline. You can still submit — you will be queued for the next available
          session.
        </p>
      )}
    </form>
  );
}
