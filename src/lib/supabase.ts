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

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
