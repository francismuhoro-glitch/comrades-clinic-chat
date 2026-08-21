import type { ReactNode } from "react";

import logo from "@/assets/clinic-logo.png";
import { useClinic } from "@/lib/clinic-store";
import { cn } from "@/lib/utils";

export function StatusBadge({ className }: { className?: string }) {
  const { doctorOnline } = useClinic();
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold",
        doctorOnline ? "bg-success/15 text-success" : "bg-destructive/12 text-destructive",
        className,
      )}
    >
      <span
        className={cn(
          "size-2 rounded-full",
          doctorOnline ? "animate-pulse bg-success" : "bg-destructive",
        )}
      />
      {doctorOnline ? "Doctor is Online" : "Doctor is Offline"}
    </span>
  );
}

export function StudentLayout({
  children,
  subtitle = "Affordable Care for Comrades",
  compact = false,
}: {
  children: ReactNode;
  subtitle?: string;
  compact?: boolean;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="no-print bg-gradient-medical px-4 pb-5 pt-5 text-primary-foreground">
        <div className="mx-auto flex max-w-md items-center gap-3">
          <img
            src={logo}
            alt="Lovable Student Clinic logo"
            className="size-11 shrink-0 rounded-xl bg-primary-foreground/10 p-1"
          />
          <div className="min-w-0">
            <h1 className={cn("font-semibold leading-tight", compact ? "text-base" : "text-lg")}>
              Lovable Student Clinic
            </h1>
            <p className="truncate text-xs opacity-90">{subtitle}</p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md flex-1 px-4 pb-10">{children}</main>
    </div>
  );
}
