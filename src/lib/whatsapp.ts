// Persistent "trouble with the site?" WhatsApp fallback.
//
// The number lives in `clinic_settings.whatsapp_number` so it can be changed
// without a code deploy. The constants below are offline / first-run defaults
// only — the live value always comes from the clinic store.

/** Default clinic WhatsApp number (international format, digits only for wa.me). */
export const WHATSAPP_FALLBACK_NUMBER = "254182528510";

/** Prefilled message — worded to bring the user back to the site. */
export const WHATSAPP_FALLBACK_MESSAGE =
  "Hi, I'm having trouble using the COMRACARE site and need help.";

/**
 * Normalize free-form input ("+254 7XX XXX XXX", "07XX…", …) to wa.me digits.
 * Falls back to the default number when empty.
 */
export function normalizeWhatsAppNumber(raw: string | null | undefined): string {
  const digits = (raw ?? "").replace(/\D/g, "");
  if (!digits) return WHATSAPP_FALLBACK_NUMBER;
  // Local Kenyan format (07… / 01…) → international without "+".
  if (digits.length === 10 && digits.startsWith("0")) return `254${digits.slice(1)}`;
  return digits;
}

/** Build the wa.me deep link with a properly URL-encoded prefilled message. */
export function buildWhatsAppUrl(
  number: string | null | undefined,
  message: string = WHATSAPP_FALLBACK_MESSAGE,
): string {
  return `https://wa.me/${normalizeWhatsAppNumber(number)}?text=${encodeURIComponent(message)}`;
}
