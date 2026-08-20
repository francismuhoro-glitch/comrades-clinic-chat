import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowLeftRight } from "lucide-react";

export function RoleSwitcher() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const onDoctor = pathname.startsWith("/doctor");

  return (
    <div className="no-print sticky top-0 z-50 bg-foreground text-background">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-1.5">
        <span className="text-[11px] font-medium uppercase tracking-wider opacity-70">
          Dev mode · {onDoctor ? "Doctor portal" : "Student app"}
        </span>
        <Link
          to={onDoctor ? "/" : "/doctor"}
          className="flex items-center gap-1.5 rounded-full bg-background/15 px-3 py-1 text-[11px] font-semibold transition-colors hover:bg-background/25"
        >
          <ArrowLeftRight className="size-3" />
          {onDoctor ? "Switch to Student View" : "Switch to Doctor Dashboard View"}
        </Link>
      </div>
    </div>
  );
}
