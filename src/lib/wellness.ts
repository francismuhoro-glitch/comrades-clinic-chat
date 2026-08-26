// Mental wellness module — shared handoff helpers.
//
// The mood check-in (landing) and the Wellness Hub route hand the selected
// focus over to the intake form through sessionStorage: lightweight, survives
// the consent gate, and leaves zero server-side trace of the self-screen.

export const MENTAL_PRESELECT_STORAGE_KEY = "comracare:preselect-symptoms";

/** Store symptom codes to preselect when the intake form next mounts. */
export function primeIntakeSymptoms(codes: string[]): void {
  try {
    sessionStorage.setItem(MENTAL_PRESELECT_STORAGE_KEY, JSON.stringify(codes));
  } catch {
    // Storage unavailable (private mode) — preselection is best-effort.
  }
}

/** Consume pending preselected symptom codes (returns [] when none). */
export function consumeIntakeSymptoms(): string[] {
  try {
    const raw = sessionStorage.getItem(MENTAL_PRESELECT_STORAGE_KEY);
    if (!raw) return [];
    sessionStorage.removeItem(MENTAL_PRESELECT_STORAGE_KEY);
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((c): c is string => typeof c === "string");
  } catch {
    return [];
  }
}
