import { MessageCircle } from "lucide-react";

import { useClinic } from "@/lib/clinic-store";
import { WHATSAPP_FALLBACK_MESSAGE, buildWhatsAppUrl } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

/**
 * Persistent site-help fallback — always rendered in the patient + doctor
 * chrome (header/footer), never tied to an error or offline state.
 *
 * Deliberately styled as secondary (muted, small, no brand colour) so it reads
 * as a fallback, not a competing channel to the main in-app chat.
 */
export function WhatsAppFallback({
  variant = "link",
  className,
}: {
  /** "link" = small footer-style sentence link; "icon" = ghost icon button. */
  variant?: "link" | "icon";
  className?: string;
}) {
  const { settings } = useClinic();
  const href = buildWhatsAppUrl(settings?.whatsapp_number, WHATSAPP_FALLBACK_MESSAGE);

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
        <MessageCircle className="size-4" />
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
      <MessageCircle className="size-3" />
      Trouble with the site? WhatsApp us
    </a>
  );
}
