import { createClient } from "@supabase/supabase-js";

function getEnv(key: string): string {
  // 1. Check import.meta.env (Vite client build)
  if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key] as string;
  }
  // 2. Check process.env (Vercel Node.js Serverless runtime)
  if (typeof process !== "undefined" && process.env && process.env[key]) {
    return process.env[key] as string;
  }
  return "";
}

const supabaseUrl = getEnv("VITE_SUPABASE_URL") || "https://placeholder-project.supabase.co";
const supabaseAnonKey = getEnv("VITE_SUPABASE_ANON_KEY") || "placeholder-anon-key";

/**
 * True when real Supabase credentials are configured. When false the app keeps
 * working locally (in-memory state) but nothing syncs between devices and
 * patient accounts are unavailable.
 */
export const isSupabaseConfigured =
  Boolean(getEnv("VITE_SUPABASE_URL")) && Boolean(getEnv("VITE_SUPABASE_ANON_KEY"));

/**
 * Optional Jitsi domain override for deployments whose network blocks
 * meet.jit.si. No keys — point VITE_JITSI_DOMAIN at any public/self-hosted
 * Jitsi instance that allows iframe embedding. Defaults to meet.jit.si.
 */
export const configuredJitsiDomain = getEnv("VITE_JITSI_DOMAIN").trim();

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Fetch the Jitsi video-call room for a consultation via the
 * `get_video_room_name` RPC. Postgres enforces
 * `consultations.patient_id = auth.uid()` inside the function, so a room name
 * is only ever returned to the signed-in patient whose consultation it is.
 * Returns null when unauthorised, the room is not open yet, or Supabase is
 * unavailable — callers show the "continue via chat" fallback.
 */
export async function getVideoRoomName(consultationId: string): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase.rpc("get_video_room_name", {
      p_consultation_id: consultationId,
    });
    if (error) {
      console.warn("get_video_room_name notice:", error.message);
      return null;
    }
    return typeof data === "string" && data.length > 0 ? data : null;
  } catch (err) {
    console.warn("get_video_room_name notice:", err);
    return null;
  }
}
