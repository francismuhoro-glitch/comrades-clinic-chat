// useChatSession — per-consultation chat wiring that makes the chat work
// offline (Layer 3 + graceful degradation).
//
// It:
//   • merges the live store messages with any messages queued locally while
//     offline (so the conversation feels continuous),
//   • routes a "send" to the live path when online, or to the offline queue when
//     not,
//   • exposes `realtimePaused` so the UI can show the "real-time paused" note
//     and suppress error noise when the socket is down.

import { useCallback, useEffect, useMemo, useState } from "react";

import { useClinic } from "./clinic-store";
import { getQueuedMessagesForSend } from "./message-queue";
import type { ChatMessage } from "./clinic-types";
import type { QueuedMessage } from "./offline-db";

function isOnline(): boolean {
  return typeof navigator === "undefined" ? true : navigator.onLine;
}

function toChatMessage(q: QueuedMessage): ChatMessage {
  return {
    id: q.id,
    session_id: q.consultationId,
    sender: q.sender === "doctor" ? "doctor" : q.sender === "system" ? "system" : "student",
    body: q.body,
    created_at: q.timestamp,
    syncStatus: "queued",
  };
}

export interface UseChatSessionResult {
  messages: ChatMessage[];
  send: (body: string) => void;
  realtimePaused: boolean;
  isOnline: boolean;
}

export function useChatSession(
  sessionId: string | null,
  viewer: "student" | "doctor",
): UseChatSessionResult {
  const { messagesFor, sendMessage } = useClinic();
  const [online, setOnline] = useState<boolean>(isOnline());
  const [queued, setQueued] = useState<QueuedMessage[]>([]);

  // Re-read the offline queue whenever connectivity changes or the session opens.
  useEffect(() => {
    let active = true;
    const refresh = () => {
      if (!sessionId) {
        setQueued([]);
        return;
      }
      void getQueuedMessagesForSend().then((all) => {
        if (!active) return;
        setQueued(all.filter((m) => m.consultationId === sessionId));
      });
    };
    refresh();

    const on = () => {
      setOnline(true);
      refresh();
    };
    const off = () => setOnline(false);

    if (typeof window !== "undefined") {
      window.addEventListener("online", on);
      window.addEventListener("offline", off);
    }
    return () => {
      active = false;
      if (typeof window !== "undefined") {
        window.removeEventListener("online", on);
        window.removeEventListener("offline", off);
      }
    };
  }, [sessionId]);

  // Re-read the queue periodically so a delivered message drops out of the list.
  useEffect(() => {
    if (online) return;
    const id = window.setInterval(() => {
      if (!sessionId) return;
      void getQueuedMessagesForSend().then((all) =>
        setQueued(all.filter((m) => m.consultationId === sessionId)),
      );
    }, 2000);
    return () => window.clearInterval(id);
  }, [online, sessionId]);

  const live = useMemo(() => (sessionId ? messagesFor(sessionId) : []), [messagesFor, sessionId]);

  const merged = useMemo(() => {
    const queuedForSession = queued.map(toChatMessage);
    return [...live, ...queuedForSession].sort((a, b) =>
      a.created_at < b.created_at ? -1 : a.created_at > b.created_at ? 1 : 0,
    );
  }, [live, queued]);

  const send = useCallback(
    (body: string) => {
      const text = body.trim();
      if (!text || !sessionId) return;
      if (isOnline()) {
        sendMessage(sessionId, viewer, text);
      } else {
        // Offline: queue locally (encrypts + persists). The queue drains on the
        // next reconnect via the sync manager.
        void import("./message-queue").then(({ queueMessage }) =>
          queueMessage(sessionId, text, viewer),
        );
      }
    },
    [sessionId, viewer, sendMessage],
  );

  // Paused when we have no connectivity (realtime socket can't be live).
  const realtimePaused = !online;

  return { messages: merged, send, realtimePaused, isOnline: online };
}
