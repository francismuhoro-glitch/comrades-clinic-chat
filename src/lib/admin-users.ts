// Admin console server functions: list users, manage roles/details, and
// create doctor accounts. Every function verifies the caller holds an admin
// portal session cookie before touching the database.
//
// Creating users with a password requires the Supabase service-role key
// (SUPABASE_SERVICE_ROLE_KEY, server-side env only — it bypasses RLS and must
// never be exposed with a VITE_ prefix). When it is not configured, admins can
// still promote existing accounts (anyone can sign up via "My Visits" email
// OTP; the profiles trigger creates the row).

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getCurrentSessionRole } from "./doctor-auth";
import { supabase, supabaseProjectUrl } from "./supabase";

export interface ProfileRow {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string | null;
  kmpdc_license: string | null;
  created_at: string | null;
}

type AdminResult = { ok: false; error: string } | { ok: true };

async function requireAdmin(): Promise<AdminResult> {
  const role = await getCurrentSessionRole();
  if (role !== "admin") return { ok: false, error: "Admin access required." };
  return { ok: true };
}

// ---------------------------------------------------------------------------
// List users
// ---------------------------------------------------------------------------

export const listProfiles = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ ok: true; profiles: ProfileRow[] } | { ok: false; error: string }> => {
    if ((await requireAdmin()).ok === false) return { ok: false, error: "Admin access required." };

    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, full_name, role, kmpdc_license, created_at")
      .order("created_at", { ascending: true });

    if (error) return { ok: false, error: error.message };
    return { ok: true, profiles: (data ?? []) as ProfileRow[] };
  },
);

// ---------------------------------------------------------------------------
// Update a user (name / license / role)
// ---------------------------------------------------------------------------

const updateProfileInput = z.object({
  id: z.string().uuid(),
  full_name: z.string().trim().min(1).max(120).optional(),
  kmpdc_license: z.string().trim().max(60).optional(),
  role: z.enum(["patient", "doctor", "admin", "psychiatrist"]).optional(),
});

export const updateProfile = createServerFn({ method: "POST" })
  .validator(updateProfileInput)
  .handler(async ({ data }): Promise<AdminResult> => {
    if ((await requireAdmin()).ok === false) return { ok: false, error: "Admin access required." };

    const patch: Record<string, unknown> = {};
    if (data["full_name"] !== undefined) patch["full_name"] = data["full_name"];
    if (data["kmpdc_license"] !== undefined) patch["kmpdc_license"] = data["kmpdc_license"];
    if (data["role"] !== undefined) patch["role"] = data["role"];
    if (Object.keys(patch).length === 0) return { ok: false, error: "Nothing to update." };

    const { error } = await supabase.from("profiles").update(patch).eq("id", data.id);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  });

// ---------------------------------------------------------------------------
// Create a doctor account (requires SUPABASE_SERVICE_ROLE_KEY)
// ---------------------------------------------------------------------------

const createDoctorInput = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(128),
  full_name: z.string().trim().min(1).max(120),
  kmpdc_license: z.string().trim().max(60).optional(),
  role: z.enum(["doctor", "psychiatrist"]).optional().default("doctor"),
});

export const createDoctor = createServerFn({ method: "POST" })
  .validator(createDoctorInput)
  .handler(async ({ data }): Promise<AdminResult> => {
    if ((await requireAdmin()).ok === false) {
      return { ok: false, error: "Admin access required." };
    }

    const serviceKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];
    if (!serviceKey) {
      return {
        ok: false,
        error:
          "SUPABASE_SERVICE_ROLE_KEY is not configured on the server. Add it in your hosting environment, or promote an existing account instead (sign up via My Visits, then set the role here).",
      };
    }

    const { createClient } = await import("@supabase/supabase-js");
    const admin = createClient(supabaseProjectUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: created, error } = await admin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.full_name },
    });
    if (error) return { ok: false, error: error.message };

    // The handle_new_user trigger creates the profile row; upsert to set the
    // role and details immediately (also covers a missing trigger).
    const role = data.role ?? "doctor";
    const { error: profileError } = await admin.from("profiles").upsert({
      id: created.user.id,
      email: data.email,
      full_name: data.full_name,
      role,
      ...(data.kmpdc_license ? { kmpdc_license: data.kmpdc_license } : {}),
    });
    if (profileError) return { ok: false, error: profileError.message };

    return { ok: true };
  });
