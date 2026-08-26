import { Link } from "@tanstack/react-router";
import { Bell, BellRing, CheckCheck } from "lucide-react";
import { useState } from "react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useNotifications, type NotificationAudience } from "@/lib/notifications";

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/**
 * 🔔 Notification bell — live via Supabase realtime.
 * - `audience="patient"`: drop into the student header; picks up rows for the
 *   logged-in account or the consultation open on this device.
 * - `audience="doctor"`: drop into the doctor portal header; shows the
 *   clinic-wide broadcast feed (new patients, payments, declines).
 */
export function NotificationBell({
  audience,
  patientId,
  consultationId,
}: {
  audience: NotificationAudience;
  patientId?: string | null;
  consultationId?: string | null;
}) {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications({
    audience,
    patientId,
    consultationId,
  });
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
          className="relative inline-flex size-9 items-center justify-center rounded-full border bg-muted/60 text-foreground transition-colors hover:bg-primary/10"
        >
          {unreadCount > 0 ? (
            <BellRing className="size-4 text-primary" />
          ) : (
            <Bell className="size-4 text-muted-foreground" />
          )}
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <p className="text-xs font-bold">
            {audience === "doctor" ? "Clinic alerts" : "Notifications"}
          </p>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => void markAllRead()}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
            >
              <CheckCheck className="size-3.5" />
              Mark all read
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <p className="px-4 py-8 text-center text-xs text-muted-foreground">
            You're all caught up 🎉
          </p>
        ) : (
          <ul className="max-h-80 divide-y overflow-y-auto">
            {notifications.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => void markRead(n.id)}
                  className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-muted/50"
                >
                  <span
                    className={`mt-1.5 size-2 shrink-0 rounded-full ${
                      n.read ? "bg-transparent" : "bg-primary"
                    }`}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span
                        className={`truncate text-xs ${n.read ? "font-medium text-muted-foreground" : "font-bold"}`}
                      >
                        {n.title}
                      </span>
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {timeAgo(n.created_at)}
                      </span>
                    </span>
                    {n.body && (
                      <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">
                        {n.body}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {audience === "patient" && (
          <div className="border-t px-3 py-2">
            <Link
              to="/visits"
              onClick={() => setOpen(false)}
              className="block text-center text-[11px] font-bold text-primary hover:underline"
            >
              Open My Visits →
            </Link>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
