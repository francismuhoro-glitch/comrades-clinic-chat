import { Link, useRouterState } from "@tanstack/react-router";
import { Stethoscope, UserRound } from "lucide-react";

import { cn } from "@/lib/utils";

/** Slim top nav: students stay on "/", clinicians open the doctor portal. */
export function RoleSwitcher() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const onDoctor = pathname.startsWith("/doctor");

  return (
    <nav className="no-print sticky top-0 z-50 border-b bg-card/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2">
        <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <img src="/favicon.svg" alt="" aria-hidden="true" className="size-4" />
          COMRACARE STUDENT CLINIC
        </span>
        <div className="flex items-center gap-1 rounded-full bg-secondary p-0.5">
          <Link
            to="/"
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold transition-colors",
              onDoctor ? "text-muted-foreground" : "bg-card text-foreground shadow-sm",
            )}
          >
            <UserRound className="size-3" /> Patient
          </Link>
          <Link
            to="/doctor"
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold transition-colors",
              onDoctor ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
            )}
          >
            <Stethoscope className="size-3" /> Doctor portal
          </Link>
        </div>
      </div>
    </nav>
  );
}
