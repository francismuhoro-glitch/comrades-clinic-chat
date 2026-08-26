/**
 * Smart triage — dynamic follow-up questions + structured pre-consult summary.
 *
 * Pure functions and data only (no React, no side effects), mirroring
 * `triage.ts` so the same rules can move server-side later.
 *
 * Flow: the intake asks the universal questions plus the ones matching the
 * selected symptoms. Options flagged `redFlag` escalate the file to emergency
 * triage and surface in the doctor's pre-consult summary card. It is decision
 * SUPPORT for the clinician — never a diagnosis.
 */

export interface SmartTriageOption {
  label: string;
  /** When chosen, the file escalates to emergency triage. */
  redFlag?: boolean;
}

export interface SmartTriageQuestion {
  id: string;
  /** Symptom code this question applies to, or "always". */
  appliesTo: string;
  question: string;
  /** Hint shown under the question (optional context for the student). */
  hint?: string;
  options: SmartTriageOption[];
}

/** Patient answers: question id → chosen option label. JSON-serializable. */
export type SmartTriageAnswers = Record<string, string>;

const DURATION_OPTIONS: SmartTriageOption[] = [
  { label: "Less than 2 days" },
  { label: "2–7 days" },
  { label: "1–4 weeks" },
  { label: "Over a month" },
];

const SEVERITY_OPTIONS: SmartTriageOption[] = [
  { label: "Mild — I can manage" },
  { label: "Moderate — hard to focus on classes" },
  { label: "Severe — struggling with daily tasks" },
];

const QUESTION_BANK: SmartTriageQuestion[] = [
  {
    id: "duration",
    appliesTo: "always",
    question: "How long has this been going on?",
    options: DURATION_OPTIONS,
  },
  {
    id: "severity",
    appliesTo: "always",
    question: "How much is it affecting your day?",
    options: SEVERITY_OPTIONS,
  },
  {
    id: "fever_flags",
    appliesTo: "fever",
    question: "With the fever, any of these?",
    options: [
      { label: "None of these" },
      { label: "Stiff neck or worst-ever headache", redFlag: true },
      { label: "Confusion or unusual sleepiness", redFlag: true },
    ],
  },
  {
    id: "cough_blood",
    appliesTo: "cough",
    question: "Have you coughed up any blood?",
    options: [{ label: "No" }, { label: "Yes — blood in sputum", redFlag: true }],
  },
  {
    id: "cough_duration",
    appliesTo: "cough",
    question: "Has the cough lasted more than 2 weeks?",
    hint: "Long coughs get screened for TB — nothing to worry about yet.",
    options: [{ label: "No" }, { label: "Yes" }],
  },
  {
    id: "stomach_flags",
    appliesTo: "stomach",
    question: "With the stomach pain, any of these?",
    options: [
      { label: "None of these" },
      { label: "Vomiting blood or black stool", redFlag: true },
      { label: "Can't keep any fluids down", redFlag: true },
    ],
  },
  {
    id: "headache_flags",
    appliesTo: "headache",
    question: "Which best describes this headache?",
    options: [
      { label: "A usual headache" },
      { label: "Sudden 'worst ever' headache", redFlag: true },
      { label: "With blurred vision or weakness", redFlag: true },
    ],
  },
  {
    id: "diarrhoea_dehydration",
    appliesTo: "diarrhoea",
    question: "Any dizziness on standing, or barely passing urine?",
    options: [{ label: "No" }, { label: "Yes", redFlag: true }],
  },
  {
    id: "urinary_spread",
    appliesTo: "urinary",
    question: "Any fever or pain in the back (flank) area?",
    options: [{ label: "No" }, { label: "Yes", redFlag: true }],
  },
  {
    id: "rash_flags",
    appliesTo: "rash",
    question: "Is the rash spreading fast, blistering, or with fever?",
    options: [{ label: "No" }, { label: "Yes", redFlag: true }],
  },
  {
    id: "fatigue_flags",
    appliesTo: "fatigue",
    question: "Any chest pain when walking, or fainting spells?",
    options: [{ label: "No" }, { label: "Yes", redFlag: true }],
  },
  {
    id: "injury_flags",
    appliesTo: "injury",
    question: "Any of these?",
    options: [
      { label: "None of these" },
      { label: "Can't bear weight or it looks deformed" },
      { label: "Head injury with blackout or vomiting", redFlag: true },
    ],
  },
  {
    id: "sti_details",
    appliesTo: "sti",
    question: "Do you have sores, ulcers, or discharge?",
    hint: "Nothing you share leaves the consultation — doctors have seen it all.",
    options: [{ label: "No" }, { label: "Yes" }],
  },
  {
    id: "mental_safety",
    appliesTo: "mental",
    question: "In the past two weeks, have you had thoughts of harming yourself?",
    hint: "This stays private between you and the doctor. Answering honestly helps us help you.",
    options: [{ label: "No" }, { label: "I'd rather not say" }, { label: "Yes", redFlag: true }],
  },
];

/** Universal questions plus the ones matching the selected symptoms, in a stable order. */
export function questionsFor(symptomCodes: string[]): SmartTriageQuestion[] {
  return QUESTION_BANK.filter(
    (q) => q.appliesTo === "always" || symptomCodes.includes(q.appliesTo),
  );
}

export interface SmartTriageSummary {
  /** Chosen options that carry a red flag — these escalate to emergency. */
  redFlags: string[];
  duration?: string | undefined;
  severity?: string | undefined;
  /** Human-readable "question — answer" lines for the clinical summary card. */
  detail: string[];
}

export function summarizeSmartTriage(
  symptomCodes: string[],
  answers?: SmartTriageAnswers | null | undefined,
): SmartTriageSummary {
  const redFlags: string[] = [];
  const detail: string[] = [];
  let duration: string | undefined;
  let severity: string | undefined;

  if (!answers) return { redFlags, duration, severity, detail };

  for (const q of questionsFor(symptomCodes)) {
    const choice = answers[q.id];
    if (!choice) continue;
    const option = q.options.find((o) => o.label === choice);
    if (!option) continue;
    if (q.id === "duration") duration = choice;
    else if (q.id === "severity") severity = choice;
    if (option.redFlag) redFlags.push(`${q.question} → ${choice}`);
    else if (q.id !== "duration" && q.id !== "severity") detail.push(`${q.question} — ${choice}`);
  }

  return { redFlags, duration, severity, detail };
}

/** Merge base symptom triage with smart-triage red flags into a final level. */
export function finalTriageLevel(
  baseLevel: "routine" | "urgent" | "emergency",
  summary: SmartTriageSummary,
): "routine" | "urgent" | "emergency" {
  return summary.redFlags.length > 0 ? "emergency" : baseLevel;
}
