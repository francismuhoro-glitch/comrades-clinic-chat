import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  (import.meta.env["VITE_SUPABASE_URL"] as string) ||
  "https://placeholder-project.supabase.co";

const supabaseAnonKey =
  (import.meta.env["VITE_SUPABASE_ANON_KEY"] as string) ||
  "placeholder-anon-key";

if (!import.meta.env["VITE_SUPABASE_URL"]) {
  console.warn(
    "VITE_SUPABASE_URL is missing. App running with local fallback state."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);