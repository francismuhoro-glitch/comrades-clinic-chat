// Referral program — student codes, invite flow, campus ambassadors, discount hook.
// Zero deps, works with existing Supabase RLS posture.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getCurrentSessionRole } from "./doctor-auth";
import { supabase } from "./supabase";
import { CONSULT_FEE_KES as BASE_FEE } from "./clinic-types";

export const REFERRAL_DISCOUNT_KES = 50;
export const REFERRAL_REWARD_KES = 30;
export const CONSULT_FEE_WITH_REFERRAL = BASE_FEE - REFERRAL_DISCOUNT_KES; // 100

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function randomCodeSuffix(len = 5): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export function generateReferralCode(fullName?: string | null): string {
  const prefix =
    (fullName?.trim().slice(0, 3) || "COM").toUpperCase().replace(/[^A-Z]/g, "") || "COM";
  const padded = (prefix + "COM").slice(0, 3);
  return `${padded}${randomCodeSuffix(5)}`; // e.g. BRI7X2A
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ReferralProfile {
  id: string;
  referral_code: string | null;
  is_ambassador: boolean | null;
  referral_credits_kes: number | null;
}

export interface ReferralRow {
  id: string;
  code: string;
  referrer_profile_id: string;
  referred_profile_id: string | null;
  referred_consultation_id: string | null;
  discount_kes: number;
  reward_kes: number;
  status: "pending" | "completed" | "rewarded";
  created_at: string;
  completed_at: string | null;
}

export interface ReferralStats {
  code: string;
  totalReferrals: number;
  completedReferrals: number;
  creditsEarned: number;
  creditsAvailable: number;
  isAmbassador: boolean;
}

export interface TopReferrer {
  profile_id: string;
  full_name: string | null;
  email: string | null;
  campus: string | null;
  referral_code: string | null;
  total: number;
  completed: number;
  is_ambassador: boolean | null;
}

// ---------------------------------------------------------------------------
// Server fns — student side
// ---------------------------------------------------------------------------

export const getMyReferralProfile = createServerFn({ method: "GET" }).handler(
  async (): Promise<
    { ok: true; profile: ReferralProfile | null } | { ok: false; error: string }
  > => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) return { ok: true, profile: null };

      const { data, error } = await supabase
        .from("profiles")
        .select("id, referral_code, is_ambassador, referral_credits_kes")
        .eq("id", userId)
        .maybeSingle();

      if (error) return { ok: false, error: error.message };
      return { ok: true, profile: (data as ReferralProfile) ?? null };
    } catch (e) {
      return {
        ok: false,
        error: e instanceof Error ? e.message : "Failed to load referral profile.",
      };
    }
  },
);

export const ensureMyReferralCode = createServerFn({ method: "POST" }).handler(
  async (): Promise<{ ok: true; code: string } | { ok: false; error: string }> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      const userEmail = userData.user?.email;
      if (!userId) return { ok: false, error: "Sign in to get your referral code." };

      // Check existing
      const { data: existing } = await supabase
        .from("profiles")
        .select("referral_code, full_name")
        .eq("id", userId)
        .maybeSingle();

      if (existing?.referral_code) {
        return { ok: true, code: existing.referral_code as string };
      }

      // Generate unique code with retries
      let code = generateReferralCode(
        (existing as { full_name?: string } | null)?.full_name ?? userEmail,
      );
      for (let attempt = 0; attempt < 5; attempt++) {
        const { data: clash } = await supabase
          .from("profiles")
          .select("id")
          .ilike("referral_code", code)
          .limit(1)
          .maybeSingle();
        if (!clash) break;
        code = generateReferralCode(
          (existing as { full_name?: string } | null)?.full_name ?? userEmail,
        );
      }

      const { error } = await supabase
        .from("profiles")
        .update({ referral_code: code })
        .eq("id", userId);
      if (error) return { ok: false, error: error.message };

      return { ok: true, code };
    } catch (e) {
      return {
        ok: false,
        error: e instanceof Error ? e.message : "Failed to create referral code.",
      };
    }
  },
);

const validateInput = z.object({ code: z.string().trim().min(3).max(20) });

export const validateReferralCode = createServerFn({ method: "POST" })
  .validator(validateInput)
  .handler(
    async ({
      data,
    }): Promise<
      | {
          ok: true;
          valid: true;
          referrer: { id: string; full_name: string | null; campus?: string | null };
        }
      | { ok: true; valid: false; reason: string }
      | { ok: false; error: string }
    > => {
      try {
        const clean = data.code.trim().toUpperCase();
        const { data: row, error } = await supabase
          .from("profiles")
          .select("id, full_name")
          .ilike("referral_code", clean)
          .maybeSingle();

        if (error) return { ok: false, error: error.message };
        if (!row) return { ok: true, valid: false, reason: "Code not found. Check spelling." };

        // Prevent self-referral
        const { data: me } = await supabase.auth.getUser();
        if (me.user?.id && me.user.id === row.id) {
          return { ok: true, valid: false, reason: "You can't use your own code." };
        }

        return {
          ok: true,
          valid: true,
          referrer: {
            id: row.id,
            full_name: (row as { full_name: string | null }).full_name ?? null,
          },
        };
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : "Validation failed." };
      }
    },
  );

export const getMyReferrals = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ ok: true; referrals: ReferralRow[] } | { ok: false; error: string }> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) return { ok: true, referrals: [] };

      const { data, error } = await supabase
        .from("referrals")
        .select("*")
        .eq("referrer_profile_id", userId)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) return { ok: false, error: error.message };
      return { ok: true, referrals: (data ?? []) as ReferralRow[] };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Failed to load referrals." };
    }
  },
);

// Called when a consultation is created with a referral code — records the referral
const createReferralInput = z.object({
  code: z.string().trim().min(3).max(20),
  consultation_id: z.string().uuid(),
});

export const createReferralRecord = createServerFn({ method: "POST" })
  .validator(createReferralInput)
  .handler(async ({ data }): Promise<{ ok: true } | { ok: false; error: string }> => {
    try {
      const clean = data.code.trim().toUpperCase();
      const { data: referrer, error: refErr } = await supabase
        .from("profiles")
        .select("id")
        .ilike("referral_code", clean)
        .maybeSingle();

      if (refErr) return { ok: false, error: refErr.message };
      if (!referrer) return { ok: false, error: "Referral code not found." };

      const { data: userData } = await supabase.auth.getUser();
      const referredProfileId = userData.user?.id ?? null;

      // Don't allow self-referral
      if (referredProfileId && referredProfileId === referrer.id) {
        return { ok: false, error: "Self-referral not allowed." };
      }

      // Insert referral tracking row
      const { error: insertErr } = await supabase.from("referrals").insert({
        code: clean,
        referrer_profile_id: referrer.id,
        referred_profile_id: referredProfileId,
        referred_consultation_id: data.consultation_id,
        discount_kes: REFERRAL_DISCOUNT_KES,
        reward_kes: REFERRAL_REWARD_KES,
        status: "pending",
      });

      if (insertErr) return { ok: false, error: insertErr.message };

      // Update consultation with referral info
      await supabase
        .from("consultations")
        .update({
          referral_code_used: clean,
          referral_discount_kes: REFERRAL_DISCOUNT_KES,
          referred_by_profile_id: referrer.id,
        })
        .eq("id", data.consultation_id);

      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Failed to record referral." };
    }
  });

// ---------------------------------------------------------------------------
// Admin side
// ---------------------------------------------------------------------------

export const getTopReferrers = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ ok: true; top: TopReferrer[] } | { ok: false; error: string }> => {
    const role = await getCurrentSessionRole();
    if (role !== "admin") return { ok: false, error: "Admin access required." };

    try {
      // Get all profiles with referral codes
      const { data: profiles, error: pErr } = await supabase
        .from("profiles")
        .select("id, full_name, email, referral_code, is_ambassador")
        .not("referral_code", "is", null)
        .limit(200);

      if (pErr) return { ok: false, error: pErr.message };

      // Get referral counts
      const { data: referrals, error: rErr } = await supabase
        .from("referrals")
        .select("referrer_profile_id, status")
        .limit(2000);

      if (rErr) return { ok: false, error: rErr.message };

      const counts = new Map<string, { total: number; completed: number }>();
      for (const r of referrals as { referrer_profile_id: string; status: string }[]) {
        const cur = counts.get(r.referrer_profile_id) ?? { total: 0, completed: 0 };
        cur.total++;
        if (r.status === "completed" || r.status === "rewarded") cur.completed++;
        counts.set(r.referrer_profile_id, cur);
      }

      const rawProfiles = (profiles ?? []) as {
        id: string;
        full_name: string | null;
        email: string | null;
        referral_code: string | null;
        is_ambassador: boolean | null;
      }[];

      const top: TopReferrer[] = rawProfiles.map((p) => {
        const c = counts.get(p.id) ?? { total: 0, completed: 0 };
        return {
          profile_id: p.id,
          full_name: p.full_name,
          email: p.email,
          campus: null,
          referral_code: p.referral_code,
          total: c.total,
          completed: c.completed,
          is_ambassador: p.is_ambassador,
        };
      });

      top.sort((a, b) => b.total - a.total);

      return { ok: true, top: top.slice(0, 20) };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Failed to load top referrers." };
    }
  },
);

const setAmbassadorInput = z.object({
  profile_id: z.string().uuid(),
  is_ambassador: z.boolean(),
});

export const setAmbassadorStatus = createServerFn({ method: "POST" })
  .validator(setAmbassadorInput)
  .handler(async ({ data }): Promise<{ ok: true } | { ok: false; error: string }> => {
    const role = await getCurrentSessionRole();
    if (role !== "admin") return { ok: false, error: "Admin access required." };

    const { error } = await supabase
      .from("profiles")
      .update({ is_ambassador: data.is_ambassador })
      .eq("id", data.profile_id);

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  });

// ---------------------------------------------------------------------------
// Client helpers (localStorage for pending ref code)
// ---------------------------------------------------------------------------

const REF_STORAGE_KEY = "comrades_pending_referral_code";

export function savePendingReferralCode(code: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(REF_STORAGE_KEY, code.trim().toUpperCase());
}

export function getPendingReferralCode(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REF_STORAGE_KEY);
}

export function clearPendingReferralCode() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(REF_STORAGE_KEY);
}

// ---------------------------------------------------------------------------
// Service-role helper for awarding credits when a referred consult completes
// (Called from clinic-store endWithPrescription/endWithReferral paths via a
// separate server fn in production; for MVP we expose a client-callable admin
// fn that uses anon key — RLS allows it, and the trigger below can also auto-award.)
// ---------------------------------------------------------------------------

export const awardReferralIfNeeded = createServerFn({ method: "POST" })
  .validator(z.object({ consultation_id: z.string().uuid() }))
  .handler(async ({ data }): Promise<{ ok: true } | { ok: false; error: string }> => {
    try {
      // Find the consultation
      const { data: consult, error: cErr } = await supabase
        .from("consultations")
        .select("id, referred_by_profile_id, referral_code_used, status")
        .eq("id", data.consultation_id)
        .maybeSingle();

      if (cErr) return { ok: false, error: cErr.message };
      if (!consult || !consult.referred_by_profile_id || !consult.referral_code_used) {
        return { ok: true }; // Not a referral, nothing to do
      }

      // Find the referral row
      const { data: refRow, error: rErr } = await supabase
        .from("referrals")
        .select("id, status, referrer_profile_id, reward_kes")
        .eq("referred_consultation_id", data.consultation_id)
        .maybeSingle();

      if (rErr) return { ok: false, error: rErr.message };
      if (!refRow || refRow.status !== "pending") return { ok: true };

      // Mark referral completed
      const { error: updErr } = await supabase
        .from("referrals")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", refRow.id);

      if (updErr) return { ok: false, error: updErr.message };

      // Award credits to referrer (increment)
      // We need to fetch current credits and add — or use a service role increment.
      // For MVP with permissive RLS, we can read then write.
      const { data: referrerProfile } = await supabase
        .from("profiles")
        .select("referral_credits_kes")
        .eq("id", refRow.referrer_profile_id)
        .maybeSingle();

      const current =
        (referrerProfile as { referral_credits_kes: number | null } | null)?.referral_credits_kes ??
        0;

      await supabase
        .from("profiles")
        .update({ referral_credits_kes: current + refRow.reward_kes })
        .eq("id", refRow.referrer_profile_id);

      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Award failed." };
    }
  });
