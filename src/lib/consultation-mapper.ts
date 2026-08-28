// Maps a Supabase `consultations` row to the local ConsultSession shape.
// Kept in its own module so both the clinic store and the visits page share
// one source of truth for the mapping.

import type { SmartTriageAnswers } from "./smart-triage";
import {
  CONSULT_FEE_KES,
  type ConsultSession,
  type LabOrder,
  type Prescription,
  type Referral,
} from "./clinic-types";

export interface ConsultationRow {
  id: string;
  patient_name?: string | null;
  patient_phone?: string | null;
  patient_email?: string | null;
  campus?: string | null;
  symptoms_description?: string | null;
  symptoms_selected?: string[] | null;
  triage_level?: "routine" | "urgent" | "emergency" | null;
  status?: string | null;
  paid?: boolean | null;
  payment_status?: "pending" | "confirmed" | "rejected" | null;
  mpesa_code?: string | null;
  payment_phone?: string | null;
  lab_test_requested?: boolean | null;
  diagnosis?: string | null;
  prescription?: Prescription | null;
  referral?: Referral | null;
  lab_order?: LabOrder | null;
  patient_id?: string | null;
  video_room_name?: string | null;
  consultation_mode?: string | null;
  triage_answers?: SmartTriageAnswers | null;
  created_at?: string | null;
  ended_at?: string | null;
  activated_at?: string | null;
  updated_at?: string | null;
  referral_code_used?: string | null;
  referral_discount_kes?: number | null;
  referred_by_profile_id?: string | null;
}

export function mapConsultationRow(row: ConsultationRow): ConsultSession {
  const mappedStatus: ConsultSession["status"] =
    row.status === "waiting"
      ? "waiting"
      : row.status === "active"
        ? "active"
        : row.status === "completed"
          ? "completed"
          : "awaiting_payment";

  return {
    id: row.id,
    full_name: row.patient_name || "Patient",
    phone: row.patient_phone || "",
    patient_email: row.patient_email ?? null,
    campus: row.campus || "",
    symptoms: row.symptoms_description || "",
    symptom_codes: row.symptoms_selected || [],
    triage_level: row.triage_level || "routine",
    emergency_flag: row.triage_level === "emergency",
    suggested_labs: [],
    status: mappedStatus,
    consultation_mode: row.consultation_mode === "video" ? "video" : "chat",
    triage_answers: row.triage_answers ?? null,
    paid:
      Boolean(row.paid) ||
      row.payment_status === "confirmed" ||
      (row.status !== "payment_pending" && row.status !== "intake"),
    fee_kes: CONSULT_FEE_KES - (row.referral_discount_kes ?? 0),
    mpesa_receipt: row.mpesa_code || null,
    mpesa_code: row.mpesa_code ?? null,
    payment_phone: row.payment_phone ?? null,
    payment_status:
      row.payment_status || (row.status === "payment_pending" ? "pending" : "confirmed"),
    lab_test_requested: Boolean(row.lab_test_requested),
    diagnosis_notes: row.diagnosis || "",
    prescription: row.prescription || null,
    referral: row.referral || null,
    lab_order: row.lab_order || null,
    patient_id: row.patient_id ?? null,
    video_room_name: row.video_room_name ?? null,
    referral_code_used: row.referral_code_used ?? null,
    referral_discount_kes: row.referral_discount_kes ?? null,
    referred_by_profile_id: row.referred_by_profile_id ?? null,
    created_at: row.created_at || new Date().toISOString(),
    ended_at: row.ended_at ?? null,
    activated_at: row.activated_at ?? null,
  };
}
