// On-request Jitsi voice/video calls, alongside the existing encrypted text
// chat (chat, messages, and encryption are untouched by this module).
//
// How it fits together:
//   * Room names are generated server-side (TanStack server function below),
//     are unguessable (192 bits of entropy), and are assigned exactly once per
//     consultation, stored in `consultations.video_room_name`.
//   * Doctors are authorised by their session cookie; patients by Supabase
//     Auth. Patients read their room through the `get_video_room_name()` RPC
//     (supabase/migrations/20260825120000_video_call_jitsi_rooms.sql), which
//     enforces `consultations.patient_id = auth.uid()` in Postgres.
//   * Calls ride on the public meet.jit.si instance — no API key, JWT, or
//     extra environment variables.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getCurrentDoctor } from "./doctor-auth";
import {
  configuredJitsiDomain,
  isSupabaseConfigured,
  supabase,
  getVideoRoomName,
} from "./supabase";

/** Public Jitsi instance — no credentials needed. Overridable via VITE_JITSI_DOMAIN. */
export const JITSI_DOMAIN = configuredJitsiDomain || "meet.jit.si";

// ---------------------------------------------------------------------------
// Server function: authorise + assign the one-time room name
// ---------------------------------------------------------------------------

const ensureVideoRoomInput = z.object({
  consultationId: z.string().uuid(),
  /**
   * Supabase access token of the signed-in patient. Required unless the
   * request carries a valid doctor session cookie.
   */
  patientAccessToken: z.string().min(1).optional(),
});

interface VideoRoomResult {
  ok: boolean;
  roomName?: string;
  error?: string;
}

export const ensureVideoRoom = createServerFn({ method: "POST" })
  .validator(ensureVideoRoomInput)
  .handler(async ({ data }): Promise<VideoRoomResult> => {
    // 1. Load the consultation row.
    const { data: rowData, error: rowError } = await supabase
      .from("consultations")
      .select("id, patient_id, video_room_name")
      .eq("id", data.consultationId)
      .maybeSingle();

    if (rowError) {
      console.error("ensureVideoRoom: failed to load consultation:", rowError.message);
      return { ok: false, error: "Could not load the consultation." };
    }
    const row = rowData as {
      id: string;
      patient_id: string | null;
      video_room_name: string | null;
    } | null;
    if (!row) return { ok: false, error: "Consultation not found." };

    // 2. Authorise: doctor session cookie first, otherwise the assigned
    //    patient's token must match consultations.patient_id.
    const doctor = await getCurrentDoctor();
    if (!doctor) {
      if (!data.patientAccessToken) {
        return { ok: false, error: "Not authorised to open this video call." };
      }
      const { data: userData, error: userError } = await supabase.auth.getUser(
        data.patientAccessToken,
      );
      const userId = userData?.user?.id;
      if (userError || !userId || userId !== row.patient_id) {
        return { ok: false, error: "Not authorised to open this video call." };
      }
    }

    // 3. One room per consultation: return the existing assignment if set.
    if (row.video_room_name) return { ok: true, roomName: row.video_room_name };

    // 4. Generate an unguessable name and store it. The conditional update
    //    (`is null`) makes concurrent starters converge on a single one-time
    //    room; the re-select returns whichever write won.
    const roomName = generateRoomName();
    const { error: updateError } = await supabase
      .from("consultations")
      .update({ video_room_name: roomName })
      .eq("id", data.consultationId)
      .is("video_room_name", null);

    if (updateError) {
      console.error("ensureVideoRoom: failed to store room name:", updateError.message);
      return { ok: false, error: "Could not open a video room." };
    }

    const { data: stored } = await supabase
      .from("consultations")
      .select("video_room_name")
      .eq("id", data.consultationId)
      .maybeSingle();
    const storedRow = stored as { video_room_name: string | null } | null;

    return { ok: true, roomName: storedRow?.video_room_name || roomName };
  });

/** 192 bits of entropy — room names cannot be guessed or enumerated. */
function generateRoomName(): string {
  const cryptoObj = globalThis.crypto;
  if (typeof cryptoObj?.getRandomValues === "function") {
    const bytes = new Uint8Array(24);
    cryptoObj.getRandomValues(bytes);
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    return `comracare-${hex}`;
  }
  return `comracare-${crypto.randomUUID?.() ?? `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`}`;
}

// ---------------------------------------------------------------------------
// Client helpers used by <VideoCall />
// ---------------------------------------------------------------------------

/** Current patient access token, or null when signed out / Supabase unset. */
export async function getPatientAccessToken(): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  } catch {
    return null;
  }
}

/**
 * Resolve the Jitsi room for a consultation from the caller's side.
 *
 * - Doctor: server function (session-cookie authorised).
 * - Patient: ownership-enforcing `get_video_room_name()` RPC first, then the
 *   server function with their access token (starts a call on request).
 *
 * Resolves `{ ok: false, reason }` when no room can be resolved — the call
 * overlay then shows the reason with the "continue via chat" fallback.
 */
export interface ResolvedVideoRoom {
  ok: boolean;
  roomName?: string;
  reason?: string;
}

export async function resolveVideoRoomName(
  consultationId: string,
  viewer: "doctor" | "patient",
  syncedRoomName?: string | null,
): Promise<ResolvedVideoRoom> {
  // Demo mode (no Supabase configured): everything lives in this browser, so
  // a deterministic per-consultation room keeps the RoleSwitcher demo working.
  // Real (Supabase-backed) rooms are always assigned by the server function.
  if (!isSupabaseConfigured) return { ok: true, roomName: `comracare-demo-${consultationId}` };

  if (viewer === "doctor") {
    const result = await ensureVideoRoom({ data: { consultationId } });
    if (result.ok && result.roomName) return { ok: true, roomName: result.roomName };
    console.warn("ensureVideoRoom notice:", result.error);
    if (syncedRoomName) return { ok: true, roomName: syncedRoomName };
    return { ok: false, reason: result.error ?? "The call room could not be opened." };
  }

  // Patient: prefer the RPC — Postgres itself enforces ownership.
  const rpcRoom = await getVideoRoomName(consultationId);
  if (rpcRoom) return { ok: true, roomName: rpcRoom };

  const token = await getPatientAccessToken();
  if (!token) {
    if (syncedRoomName) return { ok: true, roomName: syncedRoomName };
    return {
      ok: false,
      reason:
        "You're not signed in. Sign in from “My Visits” and reopen the call, or ask the doctor to start it.",
    };
  }

  const result = await ensureVideoRoom({
    data: { consultationId, patientAccessToken: token },
  });
  if (result.ok && result.roomName) return { ok: true, roomName: result.roomName };
  console.warn("ensureVideoRoom notice:", result.error);
  if (syncedRoomName) return { ok: true, roomName: syncedRoomName };
  return { ok: false, reason: result.error ?? "The call room could not be opened." };
}
