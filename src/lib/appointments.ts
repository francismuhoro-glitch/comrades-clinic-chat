/**
 * Scheduled appointment booking.
 *
 * Slots are a fixed grid in **East Africa Time** (the clinic's timezone):
 * the next 7 days, 09:00–17:00 EAT, 30-minute cells. Pending *and* confirmed
 * requests block a cell; the doctor confirms or declines from the portal.
 * Every state change fires the in-app notification bell.
 */

import { useCallback, useEffect, useState } from "react";

import { sendNotification } from "./notifications";
import { supabase } from "./supabase";

export type AppointmentStatus = "pending" | "confirmed" | "declined" | "completed" | "cancelled";

export interface Appointment {
  id: string;
  patient_name: string;
  patient_phone: string;
  patient_email: string | null;
  patient_id: string | null;
  campus: string | null;
  reason: string | null;
  slot_start: string;
  slot_end: string;
  status: AppointmentStatus;
  consultation_id: string | null;
  created_at: string;
}

const EAT_OFFSET_MS = 3 * 60 * 60 * 1000; // UTC+3 — clinic timezone
export const BOOKING_DAYS_AHEAD = 7;
export const BOOKING_START_HOUR = 9; // EAT wall-clock hour of first slot
export const BOOKING_LAST_START_HOUR = 16; // EAT wall-clock hour of last slot start
export const SLOT_MINUTES = 30;

export interface BookingSlot {
  start: string;
  end: string;
  label: string;
  taken: boolean;
  past: boolean;
}

export interface BookingDay {
  /** ISO date of the EAT calendar day (yyyy-mm-dd). */
  key: string;
  weekday: string;
  label: string;
  slots: BookingSlot[];
}

function eatWallClock(date: Date): { y: number; m: number; d: number } {
  const shifted = new Date(date.getTime() + EAT_OFFSET_MS);
  return {
    y: shifted.getUTCFullYear(),
    m: shifted.getUTCMonth(),
    d: shifted.getUTCDate(),
  };
}

const timeFmt = new Intl.DateTimeFormat("en-KE", {
  timeZone: "Africa/Nairobi",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

/** Human label ("9:00 am") for a slot start, always shown in EAT. */
export function slotLabel(iso: string): string {
  return timeFmt.format(new Date(iso));
}

const dayFmt = new Intl.DateTimeFormat("en-KE", {
  timeZone: "Africa/Nairobi",
  weekday: "short",
  day: "numeric",
  month: "short",
});

/** Today (offset days) as an EAT calendar key like "2026-08-27". */
function eatDayKey(offsetDays: number): string {
  const { y, m, d } = eatWallClock(new Date(Date.now() + offsetDays * 86_400_000));
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** Build the bookable grid for the next `BOOKING_DAYS_AHEAD` days. */
export function generateBookingDays(takenSlotStarts: string[]): BookingDay[] {
  const taken = new Set(takenSlotStarts);
  const minStart = Date.now() + 60 * 60 * 1000; // at least 1h notice
  const days: BookingDay[] = [];

  for (let offset = 0; offset < BOOKING_DAYS_AHEAD; offset++) {
    const key = eatDayKey(offset);
    const { y, m, d } = eatWallClock(new Date(Date.now() + offset * 86_400_000));
    const slots: BookingSlot[] = [];

    for (let hour = BOOKING_START_HOUR; hour <= BOOKING_LAST_START_HOUR; hour++) {
      for (let minute = 0; minute < 60; minute += SLOT_MINUTES) {
        // Convert EAT wall-clock to real UTC.
        const startMs = Date.UTC(y, m, d, hour - 3, minute);
        const endMs = startMs + SLOT_MINUTES * 60_000;
        slots.push({
          start: new Date(startMs).toISOString(),
          end: new Date(endMs).toISOString(),
          label: timeFmt.format(new Date(startMs)),
          past: startMs < minStart,
          taken: taken.has(new Date(startMs).toISOString()),
        });
      }
    }

    days.push({
      key,
      weekday: new Intl.DateTimeFormat("en-KE", {
        timeZone: "Africa/Nairobi",
        weekday: "long",
      }).format(new Date(Date.UTC(y, m, d))),
      label: dayFmt.format(new Date(Date.UTC(y, m, d))),
      slots,
    });
  }

  return days;
}

export function appointmentWhen(appt: Pick<Appointment, "slot_start">): string {
  return `${new Intl.DateTimeFormat("en-KE", {
    timeZone: "Africa/Nairobi",
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(appt.slot_start))} · ${slotLabel(appt.slot_start)}`;
}

// ---------------------------------------------------------------------------
// Live list (doctor portal + booking page availability)
// ---------------------------------------------------------------------------

export function useAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const since = new Date(Date.now() - 86_400_000).toISOString();
        const { data } = await supabase
          .from("appointments")
          .select("*")
          .gte("slot_start", since)
          .order("slot_start", { ascending: true });
        if (!cancelled && data) setAppointments(data as Appointment[]);
      } catch (err) {
        console.warn("Appointments load notice:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    const upsert = (row: Appointment) => {
      setAppointments((prev) => {
        const next = [...prev];
        const idx = next.findIndex((a) => a.id === row.id);
        if (idx >= 0) next[idx] = row;
        else next.push(row);
        return next.sort((a, b) => a.slot_start.localeCompare(b.slot_start));
      });
    };

    const channel = supabase
      .channel("appointments-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "appointments" },
        (payload) => upsert(payload.new as Appointment),
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "appointments" },
        (payload) => upsert(payload.new as Appointment),
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "appointments" },
        (payload) => {
          const old = payload.old as { id?: string };
          if (old?.id) {
            setAppointments((prev) => prev.filter((a) => a.id !== old.id));
          }
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, []);

  return { appointments, loading };
}

// ---------------------------------------------------------------------------
// Actions (each fires notification bells)
// ---------------------------------------------------------------------------

export interface BookAppointmentInput {
  patientName: string;
  patientPhone: string;
  patientEmail?: string | null | undefined;
  patientId?: string | null | undefined;
  campus?: string | null | undefined;
  reason?: string | null | undefined;
  slotStart: string;
  slotEnd: string;
}

export async function bookAppointment(
  input: BookAppointmentInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: authData } = await supabase.auth.getUser();
  const patientId = input.patientId ?? authData.user?.id ?? null;

  const { data, error } = await supabase
    .from("appointments")
    .insert({
      patient_name: input.patientName,
      patient_phone: input.patientPhone,
      patient_email: input.patientEmail ?? null,
      ...(patientId ? { patient_id: patientId } : {}),
      campus: input.campus ?? null,
      reason: input.reason ?? null,
      slot_start: input.slotStart,
      slot_end: input.slotEnd,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };

  void sendNotification({
    audience: "doctor",
    type: "appointment.requested",
    title: "New appointment request",
    body: `${input.patientName} requested ${appointmentWhen({ slot_start: input.slotStart })}.`,
  });

  return { ok: true };
}

export async function setAppointmentStatus(
  appointment: Appointment,
  status: "confirmed" | "declined" | "completed",
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await supabase
    .from("appointments")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", appointment.id);

  if (error) return { ok: false, error: error.message };

  if (appointment.patient_id) {
    if (status === "confirmed") {
      void sendNotification({
        audience: "patient",
        recipientId: appointment.patient_id,
        consultationId: appointment.consultation_id,
        type: "appointment.confirmed",
        title: "Appointment confirmed ✅",
        body: `${appointmentWhen(appointment)} — we'll be expecting you, ${appointment.patient_name.split(" ")[0]}.`,
      });
    } else if (status === "declined") {
      void sendNotification({
        audience: "patient",
        recipientId: appointment.patient_id,
        consultationId: appointment.consultation_id,
        type: "appointment.declined",
        title: "Appointment request declined",
        body: `${appointmentWhen(appointment)} didn't work out — please pick another slot or use the walk-in queue.`,
      });
    }
  }

  return { ok: true };
}

/** Hook helpers exported for components. */
export function useAppointmentActions() {
  return useCallback(
    async (appointment: Appointment, status: "confirmed" | "declined" | "completed") => {
      return setAppointmentStatus(appointment, status);
    },
    [],
  );
}
