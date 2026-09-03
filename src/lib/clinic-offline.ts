// Bridge between the live Supabase loader (clinic-store.tsx) and the IndexedDB
// offline cache (offline-db.ts). Keeps the existing realtime/reducer flow
// intact — we only (a) hydrate from cache when the network is unavailable and
// (b) persist fresh rows after every successful fetch, so the app has content to
// show offline (Layer 2) and TanStack Query can serve it with offline-first
// network mode (Layer 7).
//
// Also exposes `useOfflineQuery`, a thin wrapper over TanStack Query that applies
// the offline-safe defaults the brief asks for (offlineFirst network mode,
// retry with exponential backoff, generous stale/gc times).

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import {
  getLocalClinicSettings,
  getLocalConsultations,
  saveClinicSettingsLocally,
  saveConsultationsLocally,
} from "./offline-db";
import type { ClinicSettings } from "./clinic-types";

// Module-level cache so TanStack Query `initialData` (which must be sync) can
// read the last-known-good value without awaiting IndexedDB on every render.
let cachedConsultations: unknown[] | null = null;
let cachedSettings: Partial<ClinicSettings> | null = null;

/** Populate the in-memory snapshot from IndexedDB. Call once at app boot. */
export async function hydrateOfflineCache(): Promise<void> {
  try {
    const [consultations, settings] = await Promise.all([
      getLocalConsultations(),
      getLocalClinicSettings(),
    ]);
    if (consultations.length) cachedConsultations = consultations;
    if (settings && Object.keys(settings).length) {
      cachedSettings = settings as Partial<ClinicSettings>;
    }
  } catch {
    /* IndexedDB unavailable — non-fatal */
  }
}

export function getCachedConsultations(): unknown[] | null {
  return cachedConsultations;
}

export function getCachedSettings(): Partial<ClinicSettings> | null {
  return cachedSettings;
}

/** Persist fresh consultations to the offline cache (called after a DB fetch). */
export async function persistConsultations(rows: unknown[]): Promise<void> {
  if (!Array.isArray(rows) || rows.length === 0) return;
  cachedConsultations = rows;
  try {
    await saveConsultationsLocally(rows as Parameters<typeof saveConsultationsLocally>[0]);
  } catch {
    /* non-fatal */
  }
}

/** Persist fresh clinic settings to the offline cache (called after a DB fetch). */
export async function persistClinicSettings(settings: ClinicSettings): Promise<void> {
  if (!settings) return;
  cachedSettings = settings;
  try {
    await saveClinicSettingsLocally({
      pochi_phone: settings.pochi_phone,
      pochi_name: settings.pochi_name,
      helpline_phone: settings.helpline_phone,
      consultation_fee_kes: settings.consultation_fee_kes,
    });
  } catch {
    /* non-fatal */
  }
}

/** Offline-safe query defaults (Layer 7). */
export function useOfflineQuery<TData, TError = unknown, TData2 = TData>(
  options: UseQueryOptions<TData, TError, TData2>,
) {
  return useQuery<TData, TError, TData2>({
    networkMode: "offlineFirst",
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30_000),
    staleTime: 5 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    ...options,
  });
}
