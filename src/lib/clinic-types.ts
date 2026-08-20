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
  notes?: string;
}

export interface Referral {
  destination: string;
  reason: string;
}

export interface ConsultSession {
  id: string;
  full_name: string;
  phone: string;
  campus: string;
  symptoms: string;
  status: SessionStatus;
  paid: boolean;
  fee_kes: number;
  mpesa_receipt: string | null;
  lab_test_requested: boolean;
  diagnosis_notes: string;
  prescription: Prescription | null;
  referral: Referral | null;
  created_at: string;
  ended_at: string | null;
}

export interface Doctor {
  name: string;
  title: string;
  kmpdc_license: string;
}

export const DOCTOR: Doctor = {
  name: "Dr. Aisha Wanjiku",
  title: "MBChB, General Practitioner",
  // Hardcoded placeholder — swap for the real license number.
  kmpdc_license: "KMPDC/12345/2021",
};

export const CONSULT_FEE_KES = 150;

export const CAMPUSES = [
  "University of Nairobi",
  "Kenyatta University",
  "JKUAT",
  "Moi University",
  "Egerton University",
  "Strathmore University",
  "Technical University of Kenya",
  "Maseno University",
  "Mount Kenya University",
  "Other campus",
];
