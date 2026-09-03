// Analytics for COMRACARE admin console — pure client-side aggregation
// from the consultations table (Supabase is the source of truth).
// No new dependencies; all math is local so it works offline once data is loaded.

import { createServerFn } from "@tanstack/react-start";

import { getCurrentSessionRole } from "./doctor-auth";
import { supabase } from "./supabase";
import { CONSULT_FEE_KES, THERAPY_FEE_KES } from "./clinic-types";
import { SYMPTOM_OPTIONS, symptomLabel } from "./triage";

const BY_CODE = new Map(SYMPTOM_OPTIONS.map((o) => [o.code, o.label]));

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ConsultationAnalyticsRow {
  id: string;
  patient_name: string | null;
  campus: string | null;
  symptoms_selected: string[] | null;
  triage_level: "routine" | "urgent" | "emergency" | string | null;
  status: string | null;
  payment_status: string | null;
  consultation_mode: string | null;
  consultation_type: string | null;
  fee_kes: number | null;
  created_at: string | null;
  activated_at: string | null;
  ended_at: string | null;
}

export interface DailyBucket {
  date: string; // YYYY-MM-DD in EAT
  label: string; // e.g. "Aug 28"
  count: number;
  revenue: number;
  generalRevenue: number;
  therapyRevenue: number;
}

export interface SymptomStat {
  code: string;
  label: string;
  count: number;
}

export interface AnalyticsSummary {
  totalConsults: number;
  totalRevenue: number;
  totalGeneralRevenue: number;
  totalTherapyRevenue: number;
  totalCompleted: number;
  completionRate: number;
  avgConsultMinutes: number | null;
  avgResponseMinutes: number | null;
  triageMix: { routine: number; urgent: number; emergency: number };
  modeMix: { chat: number; video: number };
  daily: DailyBucket[];
  topSymptoms: SymptomStat[];
  campusTop: { campus: string; count: number }[];
  statusBreakdown: Record<string, number>;
  recentRevenueDaily: DailyBucket[];
}

export type AnalyticsRange = "today" | "7d" | "30d" | "90d" | "all";

export const ANALYTICS_RANGES: readonly { value: AnalyticsRange; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "all", label: "All time" },
] as const;

// ---------------------------------------------------------------------------
// Helpers — EAT (UTC+3) date handling, no external lib
// ---------------------------------------------------------------------------

function toEATDate(d: Date): Date {
  // EAT is UTC+3, no DST
  return new Date(d.getTime() + 3 * 60 * 60 * 1000);
}

function formatEATDateKey(iso: string): string {
  const d = new Date(iso);
  const eat = toEATDate(d);
  const y = eat.getUTCFullYear();
  const m = String(eat.getUTCMonth() + 1).padStart(2, "0");
  const day = String(eat.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatEATLabel(dateKey: string): string {
  const parts = dateKey.split("-").map(Number);
  const y = parts[0] ?? 2026;
  const m = parts[1] ?? 1;
  const d = parts[2] ?? 1;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString("en-KE", { month: "short", day: "numeric" });
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

// ---------------------------------------------------------------------------
// Core aggregation
// ---------------------------------------------------------------------------

function isConfirmedPayment(row: ConsultationAnalyticsRow): boolean {
  if (row.payment_status === "confirmed") return true;
  // Legacy: status already past payment_pending counts as confirmed
  if (row.status && row.status !== "payment_pending" && row.status !== "intake") {
    // If payment_status is explicitly rejected/pending, don't count
    if (row.payment_status === "rejected" || row.payment_status === "pending") return false;
    return true;
  }
  return false;
}

/**
 * Get the fee for a consultation row. Uses fee_kes from DB, or falls back to
 * CONSULT_FEE_KES / THERAPY_FEE_KES based on consultation_type.
 */
function getRowFee(row: ConsultationAnalyticsRow): number {
  if (row.fee_kes && row.fee_kes > 0) return row.fee_kes;
  // Fallback to type-based fee
  if (row.consultation_type === "therapy") return THERAPY_FEE_KES;
  return CONSULT_FEE_KES;
}

export function computeAnalytics(
  rows: ConsultationAnalyticsRow[],
  range: AnalyticsRange,
): AnalyticsSummary {
  let filtered = rows;

  if (range !== "all") {
    let cutoff: number;
    if (range === "today") {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      cutoff = start.getTime();
    } else {
      const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
      cutoff = daysAgo(days).getTime();
    }
    filtered = rows.filter((r) => {
      if (!r.created_at) return false;
      return new Date(r.created_at).getTime() >= cutoff;
    });
  }

  const totalConsults = filtered.length;
  const confirmedRows = filtered.filter(isConfirmedPayment);
  // Calculate revenue using actual fees from rows
  let totalGeneralRevenue = 0;
  let totalTherapyRevenue = 0;
  for (const r of confirmedRows) {
    const fee = getRowFee(r);
    if (r.consultation_type === "therapy") {
      totalTherapyRevenue += fee;
    } else {
      totalGeneralRevenue += fee;
    }
  }
  const totalRevenue = totalGeneralRevenue + totalTherapyRevenue;

  // Triage mix
  const triageMix = { routine: 0, urgent: 0, emergency: 0 };
  for (const r of filtered) {
    if (r.triage_level === "routine") triageMix.routine++;
    else if (r.triage_level === "urgent") triageMix.urgent++;
    else if (r.triage_level === "emergency") triageMix.emergency++;
    else triageMix.routine++;
  }

  // Mode mix
  const modeMix = { chat: 0, video: 0 };
  for (const r of filtered) {
    if (r.consultation_mode === "video") modeMix.video++;
    else modeMix.chat++;
  }

  // Status breakdown
  const statusBreakdown: Record<string, number> = {};
  for (const r of filtered) {
    const s = r.status || "unknown";
    statusBreakdown[s] = (statusBreakdown[s] ?? 0) + 1;
  }

  // Completion
  const completed = filtered.filter((r) => r.status === "completed").length;
  const completionRate = totalConsults > 0 ? Math.round((completed / totalConsults) * 100) : 0;

  // Average consult duration (created → ended) for completed
  const durations: number[] = [];
  for (const r of filtered) {
    if (r.status === "completed" && r.created_at && r.ended_at) {
      const start = new Date(r.created_at).getTime();
      const end = new Date(r.ended_at).getTime();
      const diffMin = (end - start) / 60000;
      if (diffMin >= 0 && diffMin < 24 * 60) durations.push(diffMin);
    }
  }
  const avgConsultMinutes =
    durations.length > 0
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : null;

  // Average response time (created → activated)
  const responseTimes: number[] = [];
  for (const r of filtered) {
    if (r.created_at && r.activated_at) {
      const start = new Date(r.created_at).getTime();
      const act = new Date(r.activated_at).getTime();
      const diffMin = (act - start) / 60000;
      if (diffMin >= 0 && diffMin < 24 * 60) responseTimes.push(diffMin);
    }
  }
  const avgResponseMinutes =
    responseTimes.length > 0
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
      : null;

  // Daily buckets — for range, build from oldest to newest
  const bucketDays =
    range === "today" ? 1 : range === "7d" ? 7 : range === "30d" ? 30 : range === "90d" ? 90 : 14;
  const buckets = new Map<string, DailyBucket>();
  for (let i = bucketDays - 1; i >= 0; i--) {
    const d = daysAgo(i);
    const key = formatEATDateKey(d.toISOString());
    buckets.set(key, { date: key, label: formatEATLabel(key), count: 0, revenue: 0, generalRevenue: 0, therapyRevenue: 0 });
  }
  // For "all", bucket by actual dates present (last 14 distinct)
  if (range === "all") {
    buckets.clear();
    // Build buckets from data grouped by date, sorted
    const dateCounts = new Map<string, { count: number; revenue: number; generalRevenue: number; therapyRevenue: number }>();
    for (const r of filtered) {
      if (!r.created_at) continue;
      const key = formatEATDateKey(r.created_at);
      const cur = dateCounts.get(key) ?? { count: 0, revenue: 0, generalRevenue: 0, therapyRevenue: 0 };
      cur.count++;
      if (isConfirmedPayment(r)) {
        const fee = getRowFee(r);
        cur.revenue += fee;
        if (r.consultation_type === "therapy") {
          cur.therapyRevenue += fee;
        } else {
          cur.generalRevenue += fee;
        }
      }
      dateCounts.set(key, cur);
    }
    const sortedKeys = Array.from(dateCounts.keys()).sort();
    const last14 = sortedKeys.slice(-14);
    for (const k of last14) {
      const v = dateCounts.get(k)!;
      buckets.set(k, { date: k, label: formatEATLabel(k), count: v.count, revenue: v.revenue, generalRevenue: v.generalRevenue, therapyRevenue: v.therapyRevenue });
    }
    // If no data, keep empty
    return {
      totalConsults,
      totalRevenue,
      totalGeneralRevenue,
      totalTherapyRevenue,
      totalCompleted: completed,
      completionRate,
      avgConsultMinutes,
      avgResponseMinutes,
      triageMix,
      modeMix,
      daily: Array.from(buckets.values()),
      topSymptoms: computeTopSymptoms(filtered),
      campusTop: computeCampusTop(filtered),
      statusBreakdown,
      recentRevenueDaily: Array.from(buckets.values()),
    };
  }

  for (const r of filtered) {
    if (!r.created_at) continue;
    const key = formatEATDateKey(r.created_at);
    const b = buckets.get(key);
    if (!b) continue;
    b.count++;
    if (isConfirmedPayment(r)) {
      const fee = getRowFee(r);
      b.revenue += fee;
      if (r.consultation_type === "therapy") {
        b.therapyRevenue += fee;
      } else {
        b.generalRevenue += fee;
      }
    }
  }

  const daily = Array.from(buckets.values());

  return {
    totalConsults,
    totalRevenue,
    totalGeneralRevenue,
    totalTherapyRevenue,
    totalCompleted: completed,
    completionRate,
    avgConsultMinutes,
    avgResponseMinutes,
    triageMix,
    modeMix,
    daily,
    topSymptoms: computeTopSymptoms(filtered),
    campusTop: computeCampusTop(filtered),
    statusBreakdown,
    recentRevenueDaily: daily,
  };
}

function computeTopSymptoms(rows: ConsultationAnalyticsRow[]): SymptomStat[] {
  const counts = new Map<string, number>();
  for (const r of rows) {
    const codes = r.symptoms_selected ?? [];
    for (const c of codes) {
      counts.set(c, (counts.get(c) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([code, count]) => ({
      code,
      label: BY_CODE.get(code) ?? symptomLabel(code),
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

function computeCampusTop(rows: ConsultationAnalyticsRow[]): { campus: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const r of rows) {
    const campus = (r.campus ?? "").trim() || "Unknown campus";
    counts.set(campus, (counts.get(campus) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([campus, count]) => ({ campus, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
}

// ---------------------------------------------------------------------------
// Server function — admin-only fetch
// ---------------------------------------------------------------------------

export const fetchConsultationsForAnalytics = createServerFn({ method: "GET" }).handler(
  async (): Promise<
    { ok: true; rows: ConsultationAnalyticsRow[] } | { ok: false; error: string }
  > => {
    const role = await getCurrentSessionRole();
    if (role !== "admin") {
      return { ok: false, error: "Admin access required." };
    }

    const { data, error } = await supabase
      .from("consultations")
      .select(
        "id, patient_name, campus, symptoms_selected, triage_level, status, payment_status, consultation_mode, consultation_type, fee_kes, created_at, activated_at, ended_at",
      )
      .order("created_at", { ascending: false })
      .limit(2000);

    if (error) {
      return { ok: false, error: error.message };
    }

    return { ok: true, rows: (data ?? []) as ConsultationAnalyticsRow[] };
  },
);
