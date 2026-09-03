import { Clock, Send, Stethoscope, WifiOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/lib/clinic-types";

interface ChatWindowProps {
  messages: ChatMessage[];
  /** Whose screen this is — their bubbles align right. */
  viewer: "student" | "doctor";
  onSend: (body: string) => void;
  disabled?: boolean;
  disabledLabel?: string;
  className?: string;
  emptyHint?: string;
  /** True when the realtime socket isn't live (offline or disconnected). */
  realtimePaused?: boolean;
}

function timeOf(iso: string) {
  return new Date(iso).toLocaleTimeString("en-KE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ChatWindow({
  messages,
  viewer,
  onSend,
  disabled,
  disabledLabel = "This session has ended",
  className,
  emptyHint = "Say hello and describe how you are feeling.",
  realtimePaused = false,
}: ChatWindowProps) {
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  const submit = () => {
    const body = draft.trim();
    if (!body || disabled) return;
    onSend(body);
    setDraft("");
  };

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col bg-gradient-surface", className)}>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-5">
        {messages.length === 0 && (
          <p className="mx-auto max-w-xs rounded-xl bg-card px-4 py-3 text-center text-xs text-muted-foreground shadow-card">
            {emptyHint}
          </p>
        )}

        {messages.map((m) => {
          if (m.sender === "system") {
            return (
              <div key={m.id} className="flex justify-center">
                <span className="rounded-full bg-accent px-3 py-1 text-[11px] font-medium text-accent-foreground">
                  {m.body}
                </span>
              </div>
            );
          }
          const mine = m.sender === viewer;
          return (
            <div
              key={m.id}
              className={cn("flex items-end gap-2", mine ? "justify-end" : "justify-start")}
            >
              {!mine && m.sender === "doctor" && (
                <span className="mb-1 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Stethoscope className="size-3.5" />
                </span>
              )}
              <div
                className={cn(
                  "max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-card",
                  mine
                    ? "rounded-br-md bg-chat-student text-chat-student-foreground"
                    : "rounded-bl-md bg-chat-doctor text-chat-doctor-foreground",
                )}
              >
                <p className="whitespace-pre-wrap break-words">{m.body}</p>
                <p
                  className={cn(
                    "mt-1 flex items-center gap-1 text-[10px] tabular-nums",
                    mine ? "text-chat-student-foreground/70" : "text-muted-foreground",
                  )}
                >
                  {m.syncStatus === "queued" ? (
                    <>
                      <Clock className="size-3" />
                      Sending…
                    </>
                  ) : (
                    timeOf(m.created_at)
                  )}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {realtimePaused && (
        <div className="flex items-center justify-center gap-1.5 border-t border-dashed bg-muted/40 px-3 py-1.5 text-[11px] text-muted-foreground">
          <WifiOff className="size-3" />
          Real-time chat paused — messages will deliver when you're back online.
        </div>
      )}

      <div className="border-t bg-card px-3 py-3">
        {disabled ? (
          <p className="rounded-xl bg-muted px-4 py-3 text-center text-sm font-medium text-muted-foreground">
            {disabledLabel}
          </p>
        ) : (
          <form
            className="flex items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <textarea
              rows={1}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder="Type your message…"
              className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
            <Button
              type="submit"
              size="icon"
              className="size-11 shrink-0 rounded-full"
              disabled={!draft.trim()}
              aria-label="Send message"
            >
              <Send className="size-4" />
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
