// Realtime lifecycle manager (Layer 6).
//
// Wraps the existing Supabase Realtime channel used for live chat + queue sync.
// The store's primary subscription still runs untouched; this module manages a
// *separate, idempotent* channel so we can cleanly stop it when offline (no
// error spam) and restart + backfill on reconnect without touching the store.
//
// It is transport-light: it only uses `supabase.channel(...)` (client SDK),
// which is safe to import on the client. All DOM/window access is guarded.

import { decryptMessage } from "./crypto";
import { deliverBackfilledMessages } from "./clinic-store";
import { supabase } from "./supabase";

const CHANNEL_NAME = "clinic-realtime";
const LAST_SYNC_KEY = "comrades_last_sync_time";

let channel: ReturnType<typeof supabase.channel> | null = null;

function readLastSync(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LAST_SYNC_KEY);
    return raw ? new Date(Number(raw)).toISOString() : null;
  } catch {
    return null;
  }
}

/** Start (or restart) the realtime channel. Idempotent. */
export function startRealtime(): void {
  if (typeof window === "undefined") return;
  // Tear down any prior instance so we never double-subscribe.
  stopRealtime();
  channel = supabase
    .channel(CHANNEL_NAME)
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => {
      // The store already handles live INSERTs via its own subscription; this
      // channel's job is reconnect correctness, so we rely on the store for
      // the echo. (Left as a no-op handler so the channel stays "subscribed".)
    })
    .subscribe();
}

/** Cleanly unsubscribe — call when going offline to avoid error spam. */
export function stopRealtime(): void {
  if (!channel) return;
  try {
    supabase.removeChannel(channel);
  } catch {
    /* ignore — channel may already be gone */
  }
  channel = null;
}

/**
 * On reconnect: re-subscribe and backfill any messages that arrived while we
 * were offline (created_at > lastSyncTime). Decryption + dispatch is delegated
 * to the store so de-duplication and rendering stay consistent.
 */
export async function restartRealtime(): Promise<void> {
  if (typeof window === "undefined") return;

  startRealtime();

  const since = readLastSync();
  if (!since) return;

  try {
    const { data, error } = await supabase
      .from("messages")
      .select("id, consultation_id, sender_role, content, created_at")
      .gt("created_at", since)
      .order("created_at", { ascending: true })
      .limit(500);

    if (error) {
      console.warn("Realtime backfill failed:", error.message);
      return;
    }
    if (!data || data.length === 0) return;

    const decrypted = await Promise.all(
      data.map(async (raw) => {
        const body = await decryptMessage(raw.content, raw.consultation_id);
        return {
          id: raw.id,
          consultation_id: raw.consultation_id,
          sender_role: raw.sender_role as "patient" | "doctor" | "system",
          content: body,
          created_at: raw.created_at,
        };
      }),
    );

    deliverBackfilledMessages(decrypted);
  } catch (err) {
    console.warn("Realtime backfill error:", err);
  }
}
