import { AlertTriangle, FlaskConical, ShieldCheck, Siren } from "lucide-react";
import { useState } from "react";
import { KENYAN_INSTITUTIONS } from "../../lib/kenya-institutions";
import { NearbyFacilities } from "./NearbyFacilities";

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
import { Textarea } from "@/components/ui/textarea";
import { useClinic, type IntakeInput } from "@/lib/clinic-store";
import { CAMPUSES, CONSULT_FEE_KES } from "@/lib/clinic-types";
import { EMERGENCY_NOTICE, SYMPTOM_OPTIONS, triage } from "@/lib/triage";
import { cn } from "@/lib/utils";

export function IntakeForm({ onSubmit }: { onSubmit: (input: IntakeInput) => void }) {
  const { doctorOnline } = useClinic();
  const [form, setForm] = useState<IntakeInput>({
    full_name: "",
    phone: "",
    campus: "",
    symptoms: "",
    symptom_codes: [],
  });
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim() || !form.phone.trim() || !form.campus || !form.symptoms.trim()) {
      setError("Please fill in all the fields above.");
      return;
    }
    if (!/^(?:\+?254|0)7\d{8}$|^(?:\+?254|0)1\d{8}$/.test(form.phone.replace(/\s/g, ""))) {
      setError("Enter a valid Kenyan M-Pesa number, e.g. 0712345678.");
      return;
    }
    if (form.symptom_codes.length === 0) {
      setError("Select at least one symptom so we can triage your case.");
      return;
    }
    if (!agreed) {
      setError("Please accept the medical disclaimer to continue.");
      return;
    }
    setError(null);
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="full_name">Full name</Label>
        <Input
          id="full_name"
          value={form.full_name}
          onChange={(e) => set("full_name", e.target.value)}
          placeholder="e.g. Brian Otieno"
          autoComplete="name"
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
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="campus">Institution / Campus / College</Label>
        <Select value={form.campus} onValueChange={(v) => set("campus", v)}>
          <SelectTrigger id="campus" className="w-full">
            <SelectValue placeholder="Select your institution or campus" />
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

            <div className="px-2 py-1.5 text-xs font-bold text-primary">National Polytechnics</div>
            {KENYAN_INSTITUTIONS.filter((u) => u.category === "national_poly").map((u) => (
              <SelectItem key={u.name} value={u.name}>
                {u.name} ({u.region})
              </SelectItem>
            ))}

            <div className="px-2 py-1.5 text-xs font-bold text-primary">
              TVETs, Colleges & Institutes
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

      <div className="space-y-2">
        <Label>What are you experiencing? (select all that apply)</Label>
        <div className="flex flex-wrap gap-2">
          {SYMPTOM_OPTIONS.map((s) => {
            const active = form.symptom_codes.includes(s.code);
            return (
              <button
                key={s.code}
                type="button"
                aria-pressed={active}
                onClick={() => toggleSymptom(s.code)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  active
                    ? s.level === "emergency"
                      ? "border-destructive bg-destructive/12 text-destructive"
                      : "border-primary bg-primary/10 text-primary"
                    : "bg-card text-muted-foreground hover:border-primary/40",
                )}
              >
                {s.label}
              </button>
            );
          })}
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
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="symptoms">Describe your symptoms or reason for visit</Label>
        <Textarea
          id="symptoms"
          rows={4}
          value={form.symptoms}
          onChange={(e) => set("symptoms", e.target.value)}
          placeholder="Tell the doctor what you are feeling, for how long, and any medication you have taken."
        />
      </div>

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

      <Button type="submit" size="lg" className="h-13 w-full rounded-xl text-base">
        Start Consultation (KSh {CONSULT_FEE_KES})
      </Button>

      <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
        <ShieldCheck className="size-3.5 text-success" />
        Paid securely with M-Pesa · Private &amp; confidential
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
