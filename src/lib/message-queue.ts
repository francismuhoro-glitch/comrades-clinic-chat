// Offline message queueing (Layer 3).
//
// When a patient/doctor sends a chat message with no connectivity, we:
//   1. encrypt the body with the SAME crypto path used by the online flow,
//   2. persist it to IndexedDB with status "queued",
//   3. flush it to Supabase (the `messages` table) the moment we're back online.
//
// The live persist path in `clinic-store.tsx` (`persistMessage`) is the source
// of truth for the table shape; we reuse the identical insert here so the
// encryption and columns never drift apart.

import { encryptMessage } from "./crypto";
import { supabase } from "./supabase";
import {
  deleteQueuedMessage,
  getQueuedMessages,
  putQueuedMessage,
  type QueuedMessage,
} from "./offline-db";

function newId(): string {
  return typeof globalThis.crypto?.randomUUID === "function"
    ? globalThis.crypto.randomUUID()
    : `msg-${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 10)}`;
}

function mapSenderRole(sender: string): "patient" | "doctor" | "system" {
  if (sender === "student") return "patient";
  if (sender === "doctor" || sender === "system") return sender;
  return "patient";
}

function senderDisplayName(sender: string): string {
  if (sender === "doctor") return "Doctor";
  if (sender === "system") return "System";
  return "Student";
}

export interface QueueMessageResult {
  record: QueuedMessage;
}

/**
 * Encrypt + persist an outbound message for later delivery.
 * Returns the full queued record (with decrypted `body`) so the UI can render
 * it optimistically with a "Sending…" indicator while offline.
 */
export async function queueMessage(
  consultationId: string,
  content: string,
  sender: string,
): Promise<QueueMessageResult> {
  const encryptedContent = await encryptMessage(content, consultationId);
  const record: QueuedMessage = {
    id: newId(),
    consultationId,
    body: content,
    encryptedContent,
    senderId: sender,
    sender,
    timestamp: new Date().toISOString(),
    status: "queued",
  };
  await putQueuedMessage(record);
  return { record };
}

export async function getQueuedMessagesForSend(): Promise<QueuedMessage[]> {
  return getQueuedMessages();
}

/** Upload a single queued message to Supabase, then drop it from IndexedDB. */
async function deliverOne(msg: QueuedMessage): Promise<boolean> {
  const { error } = await supabase.from("messages").insert({
    id: msg.id,
    consultation_id: msg.consultationId,
    sender_role: mapSenderRole(msg.sender),
    sender_name: senderDisplayName(msg.sender),
    content: msg.encryptedContent,
    created_at: msg.timestamp,
  });
  if (error) {
    console.warn("Failed to deliver queued message:", error.message);
    return false;
  }
  await deleteQueuedMessage(msg.id);
  return true;
}

/**
 * Attempt to deliver every queued message. Failures are left in the store so
 * they can be retried on the next reconnect. Returns counts for the UI.
 */
export async function flushMessageQueue(): Promise<{ attempted: number; delivered: number }> {
  const queued = await getQueuedMessages();
  let delivered = 0;
  for (const msg of queued) {
    try {
      const ok = await deliverOne(msg);
      if (ok) delivered += 1;
    } catch (err) {
      console.warn("flushMessageQueue delivery error:", err);
    }
  }
  return { attempted: queued.length, delivered };
}
