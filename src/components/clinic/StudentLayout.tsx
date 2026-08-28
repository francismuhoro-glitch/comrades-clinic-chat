import { Link } from "@tanstack/react-router";
import { Smartphone, Stethoscope, UserRound } from "lucide-react";
import type { ReactNode } from "react";

import { NotificationBell } from "@/components/clinic/NotificationBell";
import { useClinic } from "@/lib/clinic-store";
import type { SessionStatus } from "@/lib/clinic-types";
import { useInstallPrompt } from "@/lib/push-client";

export function StatusBadge({ status, paid }: { status: SessionStatus; paid: boolean }) {
  if (!paid || status === "awaiting_payment") {
    return (
      <span className="rounded-full bg-warning/15 px-2.5 py-0.5 text-xs font-medium text-warning-foreground">
        Payment required
      </span>
    );
  }
  const map: Record<SessionStatus, { label: string; className: string }> = {
    awaiting_payment: {
      label: "Payment required",
      className: "bg-warning/15 text-warning-foreground",
    },
    waiting: { label: "In queue", className: "bg-primary/10 text-primary" },
    active: { label: "In consultation", className: "bg-success/15 text-success" },
    completed: { label: "Completed", className: "bg-muted text-muted-foreground" },
  };
  const current = map[status] || map.waiting;
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${current.className}`}>
      {current.label}
    </span>
  );
}

export function StudentLayout({
  subtitle,
  compact = false,
  children,
}: {
  children: ReactNode;
  subtitle?: string;
  compact?: boolean;
}) {
  const { doctorOnline, studentSessionId } = useClinic();
  const { canInstall, installed, promptInstall } = useInstallPrompt();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <div>
        {/* Header */}
        <header className="sticky top-0 z-20 border-b bg-card/95 backdrop-blur px-4 py-3 shadow-sm">
          <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
            <Link to="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                <Stethoscope className="size-5" />
              </span>
              <div>
                <h1 className="text-sm font-bold leading-none">Comrades Clinic</h1>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Student Telemedicine Kenya
                </p>
              </div>
            </Link>

            <div className="flex items-center gap-2">
              {canInstall && !installed && (
                <button
                  type="button"
                  onClick={() => void promptInstall()}
                  aria-label="Install the COMRACARE app"
                  title="Install the COMRACARE app"
                  className="inline-flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                >
                  <Smartphone className="size-4" />
                </button>
              )}
              <NotificationBell audience="patient" consultationId={studentSessionId} />
              <Link
                to="/visits"
                className="inline-flex items-center gap-1 rounded-full border bg-muted/60 px-2.5 py-1 text-[11px] font-medium text-primary transition-colors hover:bg-primary/10"
              >
                <UserRound className="size-3" />
                My Visits
              </Link>
              <div className="flex items-center gap-1.5 rounded-full border bg-muted/60 px-2.5 py-1 text-[11px]">
                <span
                  className={`size-2 rounded-full ${doctorOnline ? "bg-success animate-pulse" : "bg-muted-foreground"}`}
                />
                <span className="font-medium">{doctorOnline ? "Doctor Online" : "Offline"}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content Container */}
        <main className={`mx-auto max-w-lg px-4 py-5 space-y-4 ${compact ? "pt-8" : ""}`}>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          {children}
        </main>
      </div>

      {/* Footer with Legal Links (Bypass strict router path validation via standard anchor tags) */}
      <footer className="border-t bg-card/60 px-4 py-4 text-center text-[11px] text-muted-foreground">
        <div className="mx-auto max-w-lg space-y-2">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href="/terms"
              className="hover:text-primary transition-colors underline-offset-4 hover:underline"
            >
              Terms &amp; Disclaimer
            </a>
            <a
              href="/wellness"
              className="hover:text-primary transition-colors underline-offset-4 hover:underline"
            >
              Wellness Hub
            </a>
            <a
              href="/book"
              className="hover:text-primary transition-colors underline-offset-4 hover:underline"
            >
              Book
            </a>
            <a
              href="/referrals"
              className="hover:text-primary transition-colors underline-offset-4 hover:underline font-bold"
            >
              Refer & Earn
            </a>
            <span>·</span>
            <a
              href="/privacy"
              className="hover:text-primary transition-colors underline-offset-4 hover:underline"
            >
              Privacy Policy (ODPC)
            </a>
            <span>·</span>
            <Link
              to="/doctor"
              className="hover:text-primary transition-colors underline-offset-4 hover:underline"
            >
              Clinician Portal
            </Link>
          </div>
          <p>© 2026 Comrades Clinic Kenya · Verified Non-Emergency Student Care</p>
        </div>
      </footer>
    </div>
  );
}
