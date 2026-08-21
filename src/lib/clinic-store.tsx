/**
 * Mock service layer + global state for the clinic.
 *
 * Everything the UI needs goes through `useClinic()`. To move to Supabase:
 *  - replace the reducer mutations with Postgres writes (sessions, messages)
 *  - subscribe to `messages` + `sessions` via Supabase Realtime and feed the
 *    events into `dispatch`
 *  - replace `simulatePayment` with an M-Pesa STK push + webhook status poll
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from "react";
import { decryptMessage, encryptMessage } from "./crypto";
import { supabase } from "./supabase";

import { triage } from "./triage";
import {
  CONSULT_FEE_KES,
  type ChatMessage,
  type ClinicSettings,
  type ConsultSession,
  type Prescription,
  type Referral,
} from "./clinic-types";

const uid = () =>
  typeof globalThis.crypto?.randomUUID === "function"
    ? globalThis.crypto.randomUUID()
    : `${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 10)}-4000-8000-${Math.random().toString(16).slice(2, 14)}`;
const now = () => new Date().toISOString();
const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();

const DEFAULT_SETTINGS: ClinicSettings = {
  pochi_phone: "0712345678",
  pochi_name: "COMRADES CLINIC",
  helpline_phone: "+254 712 345 678",
  consultation_fee_kes: CONSULT_FEE_KES,
};

interface State {
  doctorOnline: boolean;
  settings: ClinicSettings;
  sessions: ConsultSession[];
  messages: ChatMessage[];
}

type Action =
  | { type: "set_online"; value: boolean }
  | { type: "set_settings"; settings: ClinicSettings }
  | { type: "create_session"; session: ConsultSession }
  | { type: "mark_paid"; id: string; receipt: string }
  | { type: "activate"; id: string }
  | { type: "add_message"; message: ChatMessage }
  | { type: "patch_session"; id: string; patch: Partial<ConsultSession> };

function seed(): State {
  const s1: ConsultSession = {
    id: "seed-1",
    full_name: "Brian Otieno",
    phone: "0712 345 678",
    campus: "Kenyatta University",
    symptoms: "Sore throat and mild fever for two days. Hard to swallow.",
    symptom_codes: ["fever", "cough"],
    triage_level: "urgent",
    emergency_flag: false,
    suggested_labs: ["Malaria smear + full blood count"],
    status: "waiting",
    paid: true,
    fee_kes: CONSULT_FEE_KES,
    mpesa_receipt: "QJT4RS9LMN",
    lab_test_requested: false,
    diagnosis_notes: "",
    prescription: null,
    referral: null,
    created_at: minutesAgo(6),
    ended_at: null,
  };
  const s2: ConsultSession = {
    id: "seed-2",
    full_name: "Mercy Kamau",
    phone: "0798 111 222",
    campus: "University of Nairobi",
    symptoms: "Recurring migraines during exam week, plus blurred vision.",
    symptom_codes: ["headache", "fatigue"],
    triage_level: "urgent",
    emergency_flag: false,
    suggested_labs: ["Haemoglobin + blood sugar"],
    status: "active",
    paid: true,
    fee_kes: CONSULT_FEE_KES,
    mpesa_receipt: "QJT8XX2PQR",
    lab_test_requested: false,
    diagnosis_notes: "",
    prescription: null,
    referral: null,
    created_at: minutesAgo(14),
    ended_at: null,
  };
  const s3: ConsultSession = {
    id: "seed-3",
    full_name: "Kevin Mutiso",
    phone: "0733 909 909",
    campus: "JKUAT",
    symptoms: "Skin rash on forearms after hostel laundry change.",
    symptom_codes: ["rash"],
    triage_level: "routine",
    emergency_flag: false,
    suggested_labs: [],
    status: "completed",
    paid: true,
    fee_kes: CONSULT_FEE_KES,
    mpesa_receipt: "QJS1AB7CDE",
    lab_test_requested: false,
    diagnosis_notes: "Contact dermatitis, likely detergent irritant.",
    prescription: {
      medication: "Hydrocortisone 1% cream",
      dosage: "Apply thin layer twice daily",
      duration: "5 days",
    },
    referral: null,
    created_at: minutesAgo(90),
    ended_at: minutesAgo(70),
  };

  return {
    doctorOnline: true,
    settings: DEFAULT_SETTINGS,
    sessions: [s1, s2, s3],
    messages: [
      {
        id: uid(),
        session_id: "seed-2",
        sender: "student",
        body: "Daktari, the headache starts behind my right eye every evening.",
        created_at: minutesAgo(12),
      },
      {
        id: uid(),
        session_id: "seed-2",
        sender: "doctor",
        body: "Thanks Mercy. How many hours are you on the laptop each day?",
        created_at: minutesAgo(11),
      },
    ],
  };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "set_online":
      return { ...state, doctorOnline: action.value };
    case "set_settings":
      return { ...state, settings: action.settings };
    case "create_session":
      if (state.sessions.some((s) => s.id === action.session.id)) return state;
      return { ...state, sessions: [action.session, ...state.sessions] };
    case "mark_paid":
      return {
        ...state,
        sessions: state.sessions.map((s) =>
          s.id === action.id
            ? { ...s, paid: true, status: "waiting", mpesa_receipt: action.receipt }
            : s,
        ),
      };
    case "activate":
      return {
        ...state,
        sessions: state.sessions.map((s) =>
          s.id === action.id && s.status === "waiting" ? { ...s, status: "active" } : s,
        ),
      };
    case "add_message":
      if (state.messages.some((m) => m.id === action.message.id)) return state;
      return { ...state, messages: [...state.messages, action.message] };
    case "patch_session":
      return {
        ...state,
        sessions: state.sessions.map((s) => (s.id === action.id ? { ...s, ...action.patch } : s)),
      };
    default:
      return state;
  }
}

export interface IntakeInput {
  full_name: string;
  phone: string;
  campus: string;
  symptoms: string;
  symptom_codes: string[];
}

interface ClinicApi {
  doctorOnline: boolean;
  setDoctorOnline: (value: boolean) => void;
  settings: ClinicSettings;
  updateSettings: (patch: Partial<ClinicSettings>) => Promise<void>;
  sessions: ConsultSession[];
  pendingPayments: ConsultSession[];
  sessionsByStatus: (status: ConsultSession["status"]) => ConsultSession[];
  getSession: (id: string | null) => ConsultSession | null;
  messagesFor: (id: string | null) => ChatMessage[];
  /** Current student's session id (the person using the phone). */
  studentSessionId: string | null;
  setStudentSessionId: (id: string | null) => void;
  createSession: (input: IntakeInput) => string;
  submitPaymentClaim: (id: string, mpesaCode: string, paymentPhone: string) => Promise<void>;
  confirmPayment: (id: string) => Promise<void>;
  rejectPayment: (id: string) => Promise<void>;
  simulatePayment: (id: string) => void;
  activateSession: (id: string) => void;
  sendMessage: (id: string, sender: "student" | "doctor", body: string) => void;
  setDiagnosisNotes: (id: string, notes: string) => void;
  toggleLabTest: (id: string) => void;
  endWithPrescription: (id: string, prescription: Prescription) => void;
  endWithReferral: (id: string, referral: Referral) => void;
}

const ClinicContext = createContext<ClinicApi | null>(null);

export function ClinicProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, seed);
  const [studentSessionId, setStudentSessionId] = useState<string | null>(null);

  // Send message with AES-256 client-side encryption and Supabase sync
  const sendMessage = useCallback((id: string, sender: "student" | "doctor", body: string) => {
    const msgId = uid();
    const createdAt = now();

    // 1. Instant local optimistic dispatch (plaintext for local UI)
    dispatch({
      type: "add_message",
      message: { id: msgId, session_id: id, sender, body, created_at: createdAt },
    });

    // 2. Encrypt and persist to Supabase in background
    (async () => {
      try {
        const encryptedContent = await encryptMessage(body, id);
        const { error } = await supabase.from("messages").insert({
          id: msgId,
          consultation_id: id,
          sender_role: sender === "student" ? "patient" : sender,
          sender_name: sender === "doctor" ? "Doctor" : "Student",
          content: encryptedContent,
          created_at: createdAt,
        });
        if (error) console.error("Supabase message insert failed:", error.message);
      } catch (err) {
        console.warn("Supabase message sync notice:", err);
      }
    })();
  }, []);

  // Realtime Supabase subscription for live chat and live queue sync
  useEffect(() => {
    // 1. Fetch initial settings & consultations from Supabase database
    (async () => {
      try {
        // Fetch clinic settings
        const { data: settingsData } = await supabase
          .from("clinic_settings")
          .select("*")
          .eq("id", "default")
          .maybeSingle();

        if (settingsData) {
          dispatch({
            type: "set_settings",
            settings: {
              pochi_phone: settingsData.pochi_phone || DEFAULT_SETTINGS.pochi_phone,
              pochi_name: settingsData.pochi_name || DEFAULT_SETTINGS.pochi_name,
              helpline_phone: settingsData.helpline_phone || DEFAULT_SETTINGS.helpline_phone,
              consultation_fee_kes: settingsData.consultation_fee_kes || DEFAULT_SETTINGS.consultation_fee_kes,
            },
          });
        }

        const { data } = await supabase
          .from("consultations")
          .select("*")
          .order("created_at", { ascending: false });

        if (data && data.length > 0) {
          for (const row of data) {
            const mappedStatus: ConsultSession["status"] =
              row.status === "waiting"
                ? "waiting"
                : row.status === "active"
                  ? "active"
                  : row.status === "completed"
                    ? "completed"
                    : "awaiting_payment";

            const session: ConsultSession = {
              id: row.id,
              full_name: row.patient_name || "Patient",
              phone: row.patient_phone || "",
              campus: row.campus || "",
              symptoms: row.symptoms_description || "",
              symptom_codes: row.symptoms_selected || [],
              triage_level: row.triage_level || "routine",
              emergency_flag: row.triage_level === "emergency",
              suggested_labs: [],
              status: mappedStatus,
              paid: row.paid || row.payment_status === "confirmed" || (row.status !== "payment_pending" && row.status !== "intake"),
              fee_kes: CONSULT_FEE_KES,
              mpesa_receipt: row.mpesa_code || null,
              mpesa_code: row.mpesa_code,
              payment_phone: row.payment_phone,
              payment_status: row.payment_status || (row.status === "payment_pending" ? "pending" : "confirmed"),
              lab_test_requested: false,
              diagnosis_notes: row.diagnosis || "",
              prescription: null,
              referral: null,
              created_at: row.created_at || now(),
              ended_at: null,
            };
            dispatch({ type: "create_session", session });
          }
        }
      } catch (err) {
        console.warn("Supabase initial load notice:", err);
      }
    })();

    // 2. Realtime listener for messages & consultation queue updates
    const channel = supabase
      .channel("clinic-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        async (payload) => {
          const raw = payload.new as {
            id: string;
            consultation_id: string;
            sender_role: "patient" | "doctor" | "system";
            content: string;
            created_at: string;
          };

          if (!raw || !raw.consultation_id) return;
          const decryptedBody = await decryptMessage(raw.content, raw.consultation_id);

          dispatch({
            type: "add_message",
            message: {
              id: raw.id,
              session_id: raw.consultation_id,
              sender: raw.sender_role === "patient" ? "student" : (raw.sender_role ?? "system"),
              body: decryptedBody,
              created_at: raw.created_at || now(),
            },
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "consultations" },
        (payload) => {
          const row = payload.new as {
            id: string;
            patient_name: string;
            patient_phone: string;
            campus: string;
            symptoms_description: string;
            symptoms_selected: string[];
            triage_level: "routine" | "urgent" | "emergency";
            status: string;
            created_at: string;
          };

          if (!row || !row.id) return;

          const session: ConsultSession = {
            id: row.id,
            full_name: row.patient_name,
            phone: row.patient_phone,
            campus: row.campus,
            symptoms: row.symptoms_description,
            symptom_codes: row.symptoms_selected || [],
            triage_level: row.triage_level || "routine",
            emergency_flag: row.triage_level === "emergency",
            suggested_labs: [],
            status: "awaiting_payment",
            paid: false,
            fee_kes: CONSULT_FEE_KES,
            mpesa_receipt: null,
            lab_test_requested: false,
            diagnosis_notes: "",
            prescription: null,
            referral: null,
            created_at: row.created_at || now(),
            ended_at: null,
          };
          dispatch({ type: "create_session", session });
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "consultations" },
        (payload) => {
          const row = payload.new as {
            id: string;
            status: string;
            diagnosis?: string;
          };
          if (!row || !row.id) return;

          const mappedStatus: ConsultSession["status"] =
            row.status === "waiting"
              ? "waiting"
              : row.status === "active"
                ? "active"
                : row.status === "completed"
                  ? "completed"
                  : "awaiting_payment";

          const patch: Partial<ConsultSession> = {
            status: mappedStatus,
          };
          if (typeof row.diagnosis === "string") {
            patch.diagnosis_notes = row.diagnosis;
          }

          dispatch({
            type: "patch_session",
            id: row.id,
            patch,
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const api = useMemo<ClinicApi>(() => {
    const system = (id: string, body: string) =>
      dispatch({
        type: "add_message",
        message: { id: uid(), session_id: id, sender: "system", body, created_at: now() },
      });

    return {
      doctorOnline: state.doctorOnline,
      setDoctorOnline: (value) => dispatch({ type: "set_online", value }),
      settings: state.settings,
      updateSettings: async (patch) => {
        const updated = { ...state.settings, ...patch };
        dispatch({ type: "set_settings", settings: updated });
        try {
          await supabase.from("clinic_settings").upsert({
            id: "default",
            ...updated,
            updated_at: now(),
          });
        } catch (err) {
          console.error("Failed to update clinic settings:", err);
        }
      },
      sessions: state.sessions,
      pendingPayments: state.sessions.filter(
        (s) => s.payment_status === "pending" || s.status === "awaiting_payment"
      ),
      sessionsByStatus: (status) => state.sessions.filter((s) => s.status === status),
      submitPaymentClaim: async (id, mpesaCode, paymentPhone) => {
        dispatch({
          type: "patch_session",
          id,
          patch: {
            mpesa_code: mpesaCode,
            payment_phone: paymentPhone,
            payment_status: "pending",
          },
        });
        try {
          await supabase.from("consultations").update({
            mpesa_code: mpesaCode,
            payment_phone: paymentPhone,
            payment_status: "pending",
          }).eq("id", id);
        } catch (err) {
          console.error("Failed to submit payment claim:", err);
        }
      },
      confirmPayment: async (id) => {
        const s = state.sessions.find((x) => x.id === id);
        const receipt = s?.mpesa_code || "POCHI-" + uid().toUpperCase().slice(0, 8);
        dispatch({ type: "mark_paid", id, receipt });
        dispatch({
          type: "patch_session",
          id,
          patch: { payment_status: "confirmed", status: "waiting", paid: true },
        });
        system(id, `Payment confirmed by clinician. Consultation queued.`);
        try {
          await supabase.from("consultations").update({
            status: "waiting",
            payment_status: "confirmed",
          }).eq("id", id);
        } catch (err) {
          console.error("Failed to confirm payment in Supabase:", err);
        }
      },
      rejectPayment: async (id) => {
        dispatch({
          type: "patch_session",
          id,
          patch: { payment_status: "rejected", status: "awaiting_payment", paid: false },
        });
        system(id, `Payment reference could not be verified. Please check and resubmit.`);
        try {
          await supabase.from("consultations").update({
            payment_status: "rejected",
            status: "payment_pending",
          }).eq("id", id);
        } catch (err) {
          console.error("Failed to reject payment:", err);
        }
      },
      getSession: (id) => state.sessions.find((s) => s.id === id) ?? null,
      messagesFor: (id) => (id ? state.messages.filter((m) => m.session_id === id) : []),
      studentSessionId,
      setStudentSessionId,
      createSession: (input) => {
        const t = triage(input.symptom_codes);
        const session: ConsultSession = {
          id: uid(),
          full_name: input.full_name,
          phone: input.phone,
          campus: input.campus,
          symptoms: input.symptoms,
          symptom_codes: input.symptom_codes,
          triage_level: t.level,
          emergency_flag: t.emergency,
          suggested_labs: t.labPanels,
          status: "awaiting_payment",
          paid: false,
          fee_kes: CONSULT_FEE_KES,
          mpesa_receipt: null,
          lab_test_requested: false,
          diagnosis_notes: "",
          prescription: null,
          referral: null,
          created_at: now(),
          ended_at: null,
        };
        dispatch({ type: "create_session", session });
        setStudentSessionId(session.id);

        // Async write to Supabase consultations
        (async () => {
          try {
            const { error } = await supabase.from("consultations").insert({
              id: session.id,
              patient_name: input.full_name,
              patient_phone: input.phone,
              campus: input.campus,
              symptoms_description: input.symptoms,
              symptoms_selected: input.symptom_codes,
              triage_level: t.level,
              status: "payment_pending",
            });
            if (error) console.error("Supabase consultation insert failed:", error.message);
          } catch (err) {
            console.warn("Supabase session sync notice:", err);
          }
        })();

        return session.id;
      },
      simulatePayment: (id) => {
        const receipt = "Q" + uid().toUpperCase().slice(0, 9);
        dispatch({ type: "mark_paid", id, receipt });
        const s = state.sessions.find((x) => x.id === id);
        system(id, `Payment of KSh ${CONSULT_FEE_KES} received. Receipt ${receipt}.`);
        if (s) {
          const t = triage(s.symptom_codes);
          if (t.emergency) {
            system(
              id,
              "EMERGENCY TRIAGE: the selected symptoms are red flags. This file is marked urgent for the doctor.",
            );
          }
          if (t.labRecommended) {
            dispatch({ type: "patch_session", id, patch: { lab_test_requested: true } });
            system(
              id,
              `Auto-triage recommends a lab test${t.labPanels.length ? `: ${t.labPanels.join("; ")}` : ""}. The doctor will confirm.`,
            );
          }
        }
        if (s?.symptoms) {
          dispatch({
            type: "add_message",
            message: {
              id: uid(),
              session_id: id,
              sender: "student",
              body: s.symptoms,
              created_at: now(),
            },
          });
        }
      },
      activateSession: (id) => dispatch({ type: "activate", id }),
      sendMessage,
      setDiagnosisNotes: (id, notes) =>
        dispatch({ type: "patch_session", id, patch: { diagnosis_notes: notes } }),
      toggleLabTest: (id) => {
        const s = state.sessions.find((x) => x.id === id);
        const value = !s?.lab_test_requested;
        dispatch({ type: "patch_session", id, patch: { lab_test_requested: value } });
        system(
          id,
          value
            ? "Doctor flagged this file for lab sample collection."
            : "Lab test request withdrawn.",
        );
      },
      endWithPrescription: (id, prescription) => {
        dispatch({
          type: "patch_session",
          id,
          patch: { prescription, referral: null, status: "completed", ended_at: now() },
        });
        system(id, "Session ended. A digital prescription has been issued.");
      },
      endWithReferral: (id, referral) => {
        dispatch({
          type: "patch_session",
          id,
          patch: { referral, prescription: null, status: "completed", ended_at: now() },
        });
        system(id, "Session ended. A referral letter has been issued.");
      },
    };
  }, [state, studentSessionId, sendMessage]);

  return <ClinicContext.Provider value={api}>{children}</ClinicContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useClinic() {
  const ctx = useContext(ClinicContext);
  if (!ctx) throw new Error("useClinic must be used inside <ClinicProvider>");
  return ctx;
}
