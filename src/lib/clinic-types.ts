// Domain types for the clinic. Kept framework-agnostic so they can be reused
// verbatim as Supabase row types later.

export type SessionStatus = "awaiting_payment" | "waiting" | "active" | "completed";

export type Sender = "student" | "doctor" | "system";

export interface ChatMessage {
  id: string;
  session_id: string;
  sender: Sender;
  body: string;
  created_at: string;
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
  "pending" | "collected" | "processing" | "resulted" | "reviewed" | "declined";

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
  /** Supabase auth user id when the patient created/claimed this visit while logged in. */
  patient_id?: string | null | undefined;
  created_at: string;
  ended_at: string | null;
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
