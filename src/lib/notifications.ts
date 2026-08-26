// In-app notification center — client library.
//
// A tiny pub/sub over the `notifications` table:
//  - `sendNotification()` writes a row (fire-and-forget; never throws into the
//    caller's flow — a failed notification must never break a consultation).
//  - `useNotifications()` keeps a live list via Supabase realtime for one
//    audience: "doctor" sees broadcast rows; "patient" sees rows addressed to
//    their account (recipient_id) or to the consultation open on this device.
//
// SMS / WhatsApp / email adapters can hook into `sendNotification` later — the
// in-app delivery works with zero provider keys today.

import { useCallback, useEffect, useRef, useState } from "react";

import { supabase } from "./supabase";

export type NotificationAudience = "patient" | "doctor";

export interface ClinicNotification {
  id: string;
  audience: NotificationAudience;
  recipient_id: string | null;
  consultation_id: string | null;
  type: string;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
}

export interface SendNotificationInput {
  audience: NotificationAudience;
  /** Patient auth user id (patient audience only). */
  recipientId?: string | null;
  /** Consultation the notification is about. */
  consultationId?: string | null;
  /** Machine-readable event type, e.g. "queue.new", "doctor.ready". */
  type: string;
  title: string;
  body?: string;
}

/** Fire-and-forget notification write. Never throws. */
export async function sendNotification(input: SendNotificationInput): Promise<void> {
  try {
    const { error } = await supabase.from("notifications").insert({
      audience: input.audience,
      recipient_id: input.recipientId ?? null,
      consultation_id: input.consultationId ?? null,
      type: input.type,
      title: input.title,
      body: input.body ?? "",
    });
    if (error) console.warn("Notification insert notice:", error.message);
  } catch (err) {
    console.warn("Notification dispatch notice:", err);
  }
}

const PAGE_SIZE = 30;

export function useNotifications(opts: {
  audience: NotificationAudience;
  /** Explicit patient account id; when omitted (patient audience) the hook
   * resolves the logged-in user itself. */
  patientId?: string | null | undefined;
  /** Consultation open on this device — lets guest patients receive updates. */
  consultationId?: string | null | undefined;
}) {
  const { audience, patientId, consultationId } = opts;

  const [authPatientId, setAuthPatientId] = useState<string | null>(null);
  const [items, setItems] = useState<ClinicNotification[]>([]);
  const itemsRef = useRef<ClinicNotification[]>([]);
  itemsRef.current = items;

  // Resolve the logged-in patient once (patient audience only).
  useEffect(() => {
    if (audience !== "patient") return;
    let cancelled = false;
    void (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (!cancelled) setAuthPatientId(data.user?.id ?? null);
      } catch {
        if (!cancelled) setAuthPatientId(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [audience]);

  const effectivePatientId = patientId ?? authPatientId;

  const matches = useCallback(
    (n: ClinicNotification) => {
      if (n.audience !== audience) return false;
      if (audience === "doctor") return true;
      if (effectivePatientId && n.recipient_id === effectivePatientId) return true;
      return Boolean(consultationId && n.consultation_id === consultationId);
    },
    [audience, effectivePatientId, consultationId],
  );

  // Initial load + realtime subscription.
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const { data } = await supabase
          .from("notifications")
          .select("*")
          .eq("audience", audience)
          .order("created_at", { ascending: false })
          .limit(PAGE_SIZE);
        if (!cancelled && data) {
          setItems((data as ClinicNotification[]).filter(matches));
        }
      } catch (err) {
        console.warn("Notifications load notice:", err);
      }
    })();

    const channel = supabase
      .channel(
        `notifications-${audience}-${effectivePatientId ?? "guest"}-${consultationId ?? "none"}`,
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `audience=eq.${audience}`,
        },
        (payload) => {
          const row = payload.new as ClinicNotification;
          if (matches(row)) {
            setItems((prev) => [row, ...prev].slice(0, PAGE_SIZE));
          }
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [audience, effectivePatientId, consultationId, matches]);

  const markRead = useCallback(async (id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try {
      await supabase.from("notifications").update({ read: true }).eq("id", id);
    } catch (err) {
      console.warn("Notification mark-read notice:", err);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    const unread = itemsRef.current.filter((n) => !n.read);
    if (unread.length === 0) return;
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await supabase
        .from("notifications")
        .update({ read: true })
        .in(
          "id",
          unread.map((n) => n.id),
        );
    } catch (err) {
      console.warn("Notification mark-all-read notice:", err);
    }
  }, []);

  const unreadCount = items.filter((n) => !n.read).length;

  return { notifications: items, unreadCount, markRead, markAllRead };
}
