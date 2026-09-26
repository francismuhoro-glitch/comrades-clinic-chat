import { cn } from "@/lib/utils";
import { useClinic } from "@/lib/clinic-store";
import { WHATSAPP_FALLBACK_MESSAGE, buildWhatsAppUrl } from "@/lib/whatsapp";
import { WhatsAppGlyph } from "@/components/clinic/WhatsAppGlyph";

/**
 * Persistent site-help link to the clinic's WhatsApp number.
 *
 * PR #39 deliberately styled this as secondary. That decision is reversed here
 * for the patient-facing top of the page: `variant="button"` (header) and
 * `variant="cta"` (landing page) are brand-green, labelled and clearly visible,
 * while the footer keeps the original quiet text link.
 *
 * The link itself is unchanged: a plain `wa.me` deep link with the prefilled
 * message, using `clinic_settings.whatsapp_number` when it has loaded. It stays
 * a lightweight anchor — no third-party chat widget script, so nothing new is
 * added to the critical path.
 *
 * Colour note: white text on WhatsApp's #25D366 measures ~2:1 contrast and
 * would fail WCAG AA, so the prominent variants use the darker teal-green
 * (#0E7C70, ~5:1 with white) with the official glyph shape carrying the brand.
 */
export function WhatsAppFallback({
  variant = "link",
  className,
}: {
  /**
   * "link"   — quiet footer sentence link (unchanged from PR #39).
   * "icon"   — muted ghost icon button (legacy placement).
   * "button" — prominent header pill; label hidden on the narrowest screens.
   * "cta"    — full-width prominent call-to-action for the top of a page.
   */
  variant?: "link" | "icon" | "button" | "cta";
  className?: string;
}) {
  const { settings } = useClinic();
  const href = buildWhatsAppUrl(settings?.whatsapp_number, WHATSAPP_FALLBACK_MESSAGE);

  if (variant === "button") {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        aria-label="Trouble with the site? Message the clinic on WhatsApp (opens in a new tab)"
        title="Trouble with the site? Message the clinic on WhatsApp"
        className={cn(
          "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-[#0E7C70] px-2.5 text-[11px] font-bold text-white shadow-sm ring-1 ring-black/5 transition-colors hover:bg-[#0A655C] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0E7C70] sm:px-3.5 sm:text-xs",
          className,
        )}
      >
        <WhatsAppGlyph className="size-5 shrink-0" />
        <span className="hidden sm:inline">WhatsApp</span>
      </a>
    );
  }

  if (variant === "cta") {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className={cn(
          "flex w-full items-center gap-3 rounded-2xl border border-[#0E7C70]/30 bg-[#0E7C70] p-3.5 text-left text-white shadow-card transition-colors hover:bg-[#0A655C] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0E7C70]",
          className,
        )}
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/15">
          <WhatsAppGlyph className="size-5 text-white" />
        </span>
        <span className="min-w-0">
          <span className="block text-xs font-extrabold leading-tight">
            Trouble with the site? WhatsApp us
          </span>
          <span className="mt-0.5 block text-[11px] leading-snug text-white/85">
            If anything here isn&apos;t working, message the clinic and we&apos;ll help you keep
            going.
          </span>
        </span>
      </a>
    );
  }

  if (variant === "icon") {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        aria-label="Trouble with the site? WhatsApp us (opens in a new tab)"
        title="Trouble with the site? WhatsApp us"
        className={cn(
          "inline-flex size-8 shrink-0 items-center justify-center rounded-full border bg-muted/60 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary",
          className,
        )}
      >
        <WhatsAppGlyph className="size-4" />
      </a>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      title="Having trouble with this site? Message us on WhatsApp and we'll help you continue here."
      className={cn(
        "inline-flex items-center gap-1 text-[11px] text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline",
        className,
      )}
    >
      <WhatsAppGlyph className="size-3" />
      Trouble with the site? WhatsApp us
    </a>
  );
}
