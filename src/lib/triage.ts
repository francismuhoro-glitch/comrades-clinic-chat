/**
 * Symptom checklist + automated triage rules.
 *
 * Pure functions only — no React, no side effects — so the same rules can run
 * inside a Supabase edge function / Postgres trigger later.
 */

export type TriageLevel = "routine" | "urgent" | "emergency";

export interface SymptomOption {
  code: string;
  label: string;
  /** Highest triage level this symptom alone can justify. */
  level: TriageLevel;
  /** When set, selecting this symptom recommends a lab test. */
  lab?: string;
}

export const SYMPTOM_OPTIONS: SymptomOption[] = [
  { code: "fever", label: "Fever / chills", level: "urgent", lab: "Malaria smear + full blood count" },
  { code: "cough", label: "Cough / sore throat", level: "routine" },
  { code: "headache", label: "Headache", level: "routine" },
  { code: "stomach", label: "Stomach pain", level: "urgent", lab: "Stool analysis + H. pylori test" },
  { code: "diarrhoea", label: "Diarrhoea / vomiting", level: "urgent", lab: "Stool culture + urea & electrolytes" },
  { code: "urinary", label: "Painful urination", level: "urgent", lab: "Urinalysis (urine M/C/S)" },
  { code: "rash", label: "Skin rash", level: "routine" },
  { code: "fatigue", label: "Unusual fatigue / dizziness", level: "urgent", lab: "Haemoglobin + blood sugar" },
  { code: "sti", label: "STI concern", level: "urgent", lab: "STI screen (VDRL, HIV, swab)" },
  { code: "mental", label: "Stress, anxiety or low mood", level: "routine" },
  { code: "injury", label: "Injury / sprain", level: "routine" },
  { code: "chest_pain", label: "Chest pain or tightness", level: "emergency" },
  { code: "breathing", label: "Difficulty breathing", level: "emergency" },
  { code: "bleeding", label: "Heavy bleeding", level: "emergency" },
  { code: "fainting", label: "Fainting or seizure", level: "emergency" },
  { code: "selfharm", label: "Thoughts of self-harm", level: "emergency" },
];

const BY_CODE = new Map(SYMPTOM_OPTIONS.map((s) => [s.code, s]));

export const symptomLabel = (code: string) => BY_CODE.get(code)?.label ?? code;

export interface TriageResult {
  level: TriageLevel;
  emergency: boolean;
  /** True when the selected symptoms warrant sample collection. */
  labRecommended: boolean;
  /** Human-readable lab panels suggested by the selected symptoms. */
  labPanels: string[];
  emergencySymptoms: string[];
}

const RANK: Record<TriageLevel, number> = { routine: 0, urgent: 1, emergency: 2 };

export function triage(codes: string[]): TriageResult {
  const picked = codes.map((c) => BY_CODE.get(c)).filter((s): s is SymptomOption => !!s);

  let level: TriageLevel = "routine";
  for (const s of picked) if (RANK[s.level] > RANK[level]) level = s.level;

  const labPanels = [...new Set(picked.map((s) => s.lab).filter((l): l is string => !!l))];
  // Two or more urgent symptoms together also warrant a lab workup.
  const urgentCount = picked.filter((s) => s.level !== "routine").length;

  return {
    level,
    emergency: level === "emergency",
    labRecommended: labPanels.length > 0 || urgentCount >= 2,
    labPanels,
    emergencySymptoms: picked.filter((s) => s.level === "emergency").map((s) => s.label),
  };
}

export const EMERGENCY_NOTICE =
  "Your answers suggest a possible emergency. Go to the nearest hospital or call 999 / 1199 now — do not wait for the chat.";
