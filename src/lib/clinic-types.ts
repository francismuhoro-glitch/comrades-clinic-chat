// Domain types for the clinic. Kept framework-agnostic so they can be reused
// verbatim as Supabase row types later.

import type { SmartTriageAnswers } from "./smart-triage";

export type SessionStatus = "awaiting_payment" | "waiting" | "active" | "completed";

export type Sender = "student" | "doctor" | "system";

/**
 * How the patient prefers to consult, chosen while registering (intake).
 * "video" means an on-request Jitsi voice/video call; chat remains available
 * to everyone regardless of the choice.
 */
export type ConsultationMode = "chat" | "video";

export interface ChatMessage {
  id: string;
  session_id: string;
  sender: Sender;
  body: string;
  created_at: string;
  /**
   * Set when the message was created offline and is awaiting delivery. Drives
   * the "Sending…" indicator in the chat UI. Absent for synced messages.
   */
  syncStatus?: "queued" | "sent" | "synced";
}

export interface Prescription {
  medication: string;
  dosage: string;
  duration: string;
  notes?: string | undefined;
}

export interface Referral {
  destination: string;
  reason: string;
}

export type LabCollectionMethod = "visit_lab" | "doorstep";

export type LabOrderStatus =
  | "pending"
  | "collected"
  | "processing"
  | "resulted"
  | "reviewed"
  | "declined";

/** Ordered fulfilment pipeline the doctor advances a lab order through. */
export const LAB_ORDER_PIPELINE: readonly Exclude<LabOrderStatus, "declined">[] = [
  "pending",
  "collected",
  "processing",
  "resulted",
  "reviewed",
];

export const LAB_ORDER_STATUS_LABELS: Record<LabOrderStatus, string> = {
  pending: "Pending collection",
  collected: "Sample collected",
  processing: "Processing at lab",
  resulted: "Results ready",
  reviewed: "Reviewed by doctor",
  declined: "Declined by patient",
};

export type LabResultFlag = "normal" | "low" | "high" | "critical";
export type LabResultStage = "pending" | "collected" | "processing" | "resulted" | "reviewed";

export const LAB_RESULT_STAGES: readonly LabResultStage[] = [
  "pending",
  "collected",
  "processing",
  "resulted",
  "reviewed",
];

export const LAB_RESULT_STAGE_LABELS: Record<LabResultStage, string> = {
  pending: "Pending collection",
  collected: "Sample collected",
  processing: "Processing at lab",
  resulted: "Results ready",
  reviewed: "Reviewed by doctor",
};

export interface LabResult {
  id: string;
  consultation_id: string;
  panel: string;
  result_value: string;
  unit: string;
  reference_range: string;
  flag: LabResultFlag;
  notes: string;
  stage: LabResultStage;
  loinc_code: string;
  loinc_display: string;
  created_at: string;
  updated_at: string;
}

export interface LabTestCatalogItem {
  loinc_code: string;
  display_name: string;
  specimen: string;
  common_unit: string;
  reference_range: string;
  active: boolean;
}

export const FALLBACK_LAB_CATALOG: LabTestCatalogItem[] = [
  {
    loinc_code: "58410-2",
    display_name: "Complete Blood Count (CBC)",
    specimen: "Whole Blood",
    common_unit: "10^3/uL",
    reference_range: "4.0-10.0",
    active: true,
  },
  {
    loinc_code: "718-7",
    display_name: "Hemoglobin",
    specimen: "Whole Blood",
    common_unit: "g/dL",
    reference_range: "12.0-16.0",
    active: true,
  },
  {
    loinc_code: "6690-2",
    display_name: "White Blood Cells (WBC)",
    specimen: "Whole Blood",
    common_unit: "10^3/uL",
    reference_range: "4.0-11.0",
    active: true,
  },
  {
    loinc_code: "777-3",
    display_name: "Platelets",
    specimen: "Whole Blood",
    common_unit: "10^3/uL",
    reference_range: "150-450",
    active: true,
  },
  {
    loinc_code: "32700-7",
    display_name: "Malaria Smear",
    specimen: "Capillary/Whole Blood",
    common_unit: "qualitative",
    reference_range: "Negative",
    active: true,
  },
  {
    loinc_code: "24356-8",
    display_name: "Urinalysis Panel",
    specimen: "Urine",
    common_unit: "qualitative",
    reference_range: "Normal",
    active: true,
  },
  {
    loinc_code: "10701-1",
    display_name: "Stool Ova & Parasites",
    specimen: "Stool",
    common_unit: "qualitative",
    reference_range: "Negative",
    active: true,
  },
  {
    loinc_code: "17780-8",
    display_name: "H. pylori Antigen",
    specimen: "Stool",
    common_unit: "qualitative",
    reference_range: "Negative",
    active: true,
  },
  {
    loinc_code: "1558-6",
    display_name: "Fasting Blood Glucose",
    specimen: "Plasma",
    common_unit: "mmol/L",
    reference_range: "3.9-5.6",
    active: true,
  },
  {
    loinc_code: "2106-3",
    display_name: "hCG Urine (Pregnancy Test)",
    specimen: "Urine",
    common_unit: "qualitative",
    reference_range: "Negative",
    active: true,
  },
  {
    loinc_code: "1988-5",
    display_name: "C-Reactive Protein (CRP)",
    specimen: "Serum",
    common_unit: "mg/L",
    reference_range: "< 5.0",
    active: true,
  },
];

export interface LabOrder {
  panels: string[];
  /** Not set when the patient declined the lab request. */
  collection_method?: LabCollectionMethod | undefined;
  scheduled_date?: string | undefined;
  scheduled_time?: string | undefined;
  collection_address?: string | undefined;
  collection_phone?: string | undefined;
  status: LabOrderStatus;
  /** Optional patient-provided reason when status is "declined". */
  decline_reason?: string | undefined;
}

export interface ConsultSession {
  id: string;
  full_name: string;
  phone: string;
  campus: string;
  symptoms: string;
  /** Codes from SYMPTOM_OPTIONS in src/lib/triage.ts */
  symptom_codes: string[];
  triage_level: "routine" | "urgent" | "emergency";
  emergency_flag: boolean;
  /** Lab panels auto-suggested by the triage rules. */
  suggested_labs: string[];
  status: SessionStatus;
  /** Consultation preference the patient selected at intake. */
  consultation_mode: ConsultationMode;
  /** Smart-triage follow-up answers (duration, severity, red-flag screeners). */
  triage_answers?: SmartTriageAnswers | null | undefined;
  paid: boolean;
  fee_kes: number;
  mpesa_receipt: string | null;
  mpesa_code?: string | null | undefined;
  payment_phone?: string | null | undefined;
  payment_status?: "pending" | "confirmed" | "rejected" | undefined;
  lab_test_requested: boolean;
  diagnosis_notes: string;
  prescription: Prescription | null;
  referral: Referral | null;
  lab_order?: LabOrder | null | undefined;
  /** Optional patient email address provided at intake or associated with account. */
  patient_email?: string | null | undefined;
  /** Supabase auth user id when the patient created/claimed this visit while logged in. */
  patient_id?: string | null | undefined;
  /**
   * Unguessable Jitsi room for the on-request voice/video call. Assigned once
   * per consultation server-side; null until somebody starts a call.
   */
  video_room_name?: string | null | undefined;
  /** Referral code the patient used at intake (if any). */
  referral_code_used?: string | null | undefined;
  /** Discount in KSh applied via referral (e.g. 50). */
  referral_discount_kes?: number | null | undefined;
  /** Profile id of the referrer (who owns the code). */
  referred_by_profile_id?: string | null | undefined;
  /** Type of consultation: general or therapy. */
  consultation_type: ConsultationType;
  /** Profile id of assigned psychiatrist (for therapy sessions). */
  assigned_to?: string | null | undefined;
  created_at: string;
  ended_at: string | null;
  activated_at?: string | null | undefined;
}

export interface Doctor {
  name: string;
  title: string;
  kmpdc_license: string;
}

export interface ClinicSettings {
  pochi_phone: string;
  pochi_name: string;
  helpline_phone: string;
  consultation_fee_kes: number;
}

export const DOCTOR: Doctor = {
  name: "Dr. Francis Muhoro, MBChB",
  title: "General Practitioner · Telemedicine Lead",
  kmpdc_license: "A.84920",
};

export const CONSULT_FEE_KES = 150;
export const THERAPY_FEE_KES = 250;

export type ConsultationType = "general" | "therapy";
