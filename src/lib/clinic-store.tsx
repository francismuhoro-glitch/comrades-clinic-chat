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
  type LabOrder,
  type Prescription,
  type Referral,
} from "./clinic-types";

const uid = () =>
  typeof globalThis.crypto?.randomUUID === "function"
    ? globalThis.crypto.randomUUID()
    : `${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 10)}-4000-8000-${Math.random().toString(16).slice(2, 14)}`;
const now = () => new Date().toISOString();
const minutesAgo = (m: number) =>
  new Date(Date.now() - m * 60_000).toISOString();

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
    symptom_codes: ["headache"],
    triage_level: "routine",
    emergency_flag: false,
    suggested_labs: [],
    status: "active",
    paid: true,
    fee_kes: CONSULT_FEE_KES,
    mpesa_receipt: "QAA8811KLL",
    lab_test_requested: false,
    diagnosis_notes: "Tension headache secondary to stress. Advised sleep + hydration.",
    prescription: null,
    referral: null,
    created_at: minutesAgo(24),
    ended_at: null,
  };
  const s3: ConsultSession = {
    id: "seed-3",
    full_name: "Kelvin Kiprop",
    phone: "0701 999 888",
    campus: "Strathmore University",
    symptoms: "Abdominal cramps and diarrhoea after eating at the mess.",
    symptom_codes: ["stomach", "diarrhoea"],
    triage_level: "urgent",
    emergency_flag: false,
    suggested_labs: ["Stool analysis + H. pylori test"],
    status: "completed",
    paid: true,
    fee_kes: CONSULT_FEE_KES,
    mpesa_receipt: "QPP0099ZZA",
    lab_test_requested: false,
    diagnosis_notes:
      "Acute gastroenteritis. Prescribed oral rehydration salts and Zinc.",
    prescription: {
      medication: "Oral Rehydration Salts (ORS) + Zinc sulphate 20mg",
      dosage: "1 sachet in 1L clean water, sip throughout day. Zinc 1 tab OD.",
      duration: "3 days",
      notes: "Maintain good hydration. Return if blood in stool.",
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
        id: "m-1",
        session_id: "seed-2",
        sender: "system",
        body: "Consultation started with Dr. Francis Muhoro.",
        created_at: minutesAgo(20),
      },
      {
        id: "m-2",
        session_id: "seed-2",
        sender: "student",
        body: "Hello doc, I've had this terrible headache for 3 days now.",
        created_at: minutesAgo(18),
      },
      {
        id: "m-3",
        session_id: "seed-2",
        sender: "doctor",
        body: "Habari Mercy. Are you experiencing any neck stiffness or sensitivity to bright light?",
        created_at: minutesAgo(15),
      },
      {
        id: "m-4",
        session_id: "seed-2",
        sender: "student",
        body: "Light hurts a bit, but my neck feels okay. It gets worse when studying on my laptop.",
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
          s.id === action.id && s.status === "waiting"
            ? { ...s, status: "active" }
            : s,
        ),
      };
    case "add_message":
      if (state.messages.some((m) => m.id === action.message.id)) return state;
      return { ...state, messages: [...state.messages, action.message] };
    case "patch_session":
      return {
        ...state,
        sessions: state.sessions.map((s) =>
          s.id === action.id ? { ...s, ...action.patch } : s,
        ),
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
  resumeSessionByPhone: (phone: string) => Promise<boolean>;
  clearActiveSession: () => void;
  submitPaymentClaim: (
    id: string,
    mpesaCode: string,
    paymentPhone: string,
  ) => Promise<void>;
  confirmPayment: (id: string) => Promise<void>;
  rejectPayment: (id: string) => Promise<void>;
  submitLabOrder: (id: string, order: LabOrder) => Promise<void>;
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

  // Auto-restore session ID from localStorage across browser restarts
  const [studentSessionId, setStudentSessionIdState] = useState<string | null>(
    () => {
      if (typeof window !== "undefined") {
        return localStorage.getItem("comrades_active_session_id") || null;
      }
      return null;
    },
  );

  const setStudentSessionId = useCallback((id: string | null) => {
    setStudentSessionIdState(id);
    if (typeof window !== "undefined") {
      if (id) {
        localStorage.setItem("comrades_active_session_id", id);
      } else {
        localStorage.removeItem("comrades_active_session_id");
      }
    }
  }, []);

  const clearActiveSession = useCallback(() => {
    setStudentSessionIdState(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("comrades_active_session_id");
    }
  }, []);

  // Send message with AES-256 client-side encryption and Supabase sync
  const sendMessage = useCallback(
    (id: string, sender: "student" | "doctor", body: string) => {
      const msgId = uid();
      const createdAt = now();

      dispatch({
        type: "add_message",
        message: {
          id: msgId,
          session_id: id,
          sender,
          body,
          created_at: createdAt,
        },
      });

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
          if (error)
            console.error("Supabase message insert failed:", error.message);
        } catch (err) {
          console.warn("Supabase message sync notice:", err);
        }
      })();
    },
    [],
  );

  // Realtime Supabase subscription for live chat and live queue sync
  useEffect(() => {
    (async () => {
      try {
        const { data: settingsData } = await supabase
          .from("clinic_settings")
          .select("*")
          .eq("id", "default")
          .maybeSingle();

        if (settingsData) {
          dispatch({
            type: "set_settings",
            settings: {
              pochi_phone:
                settingsData.pochi_phone || DEFAULT_SETTINGS.pochi_phone,
              pochi_name:
                settingsData.pochi_name || DEFAULT_SETTINGS.pochi_name,
              helpline_phone:
                settingsData.helpline_phone || DEFAULT_SETTINGS.helpline_phone,
              consultation_fee_kes:
                settingsData.consultation_fee_kes ||
                DEFAULT_SETTINGS.consultation_fee_kes,
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
              paid:
                row.paid ||
                row.payment_status === "confirmed" ||
                (row.status !== "payment_pending" && row.status !== "intake"),
              fee_kes: CONSULT_FEE_KES,
              mpesa_receipt: row.mpesa_code || null,
              mpesa_code: row.mpesa_code,
              payment_phone: row.payment_phone,
              payment_status:
                row.payment_status ||
                (row.status === "payment_pending" ? "pending" : "confirmed"),
              lab_test_requested: Boolean(row.lab_test_requested),
              diagnosis_notes: row.diagnosis || "",
              prescription: row.prescription || null,
              referral: row.referral || null,
              lab_order: row.lab_order || null,
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
          const decryptedBody = await decryptMessage(
            raw.content,
            raw.consultation_id,
          );

          dispatch({
            type: "add_message",
            message: {
              id: raw.id,
              session_id: raw.consultation_id,
              sender:
                raw.sender_role === "patient"
                  ? "student"
                  : (raw.sender_role ?? "system"),
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
            prescription?: Prescription;
            referral?: Referral;
            lab_order?: LabOrder;
            payment_status?: "pending" | "confirmed" | "rejected";
            lab_test_requested?: boolean;
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
            paid: row.payment_status === "confirmed" || row.status === "waiting" || row.status === "active" || row.status === "completed",
          };
          if (typeof row.diagnosis === "string") {
            patch.diagnosis_notes = row.diagnosis;
          }
          if (row.prescription) {
            patch.prescription = row.prescription;
          }
          if (row.referral) {
            patch.referral = row.referral;
          }
          if (row.lab_order) {
            patch.lab_order = row.lab_order;
          }
          if (row.payment_status) {
            patch.payment_status = row.payment_status;
          }
          if (typeof row.lab_test_requested === "boolean") {
            patch.lab_test_requested = row.lab_test_requested;
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
        message: {
          id: uid(),
          session_id: id,
          sender: "system",
          body,
          created_at: now(),
        },
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
        (s) =>
          (s.payment_status === "pending" || s.status === "awaiting_payment") &&
          !s.paid,
      ),
      sessionsByStatus: (status) =>
        state.sessions.filter((s) => s.status === status),
      getSession: (id) => state.sessions.find((s) => s.id === id) ?? null,
      messagesFor: (id) =>
        id ? state.messages.filter((m) => m.session_id === id) : [],
      studentSessionId,
      setStudentSessionId,
      clearActiveSession,
      resumeSessionByPhone: async (searchPhone: string) => {
        const cleaned = searchPhone.trim().replace(/\s/g, "");
        // Search local state first
        const local = state.sessions.find(
          (s) =>
            s.phone.replace(/\s/g, "") === cleaned &&
            s.status !== "completed",
        );
        if (local) {
          setStudentSessionId(local.id);
          return true;
        }
        // Search Supabase
        try {
          const { data } = await supabase
            .from("consultations")
            .select("*")
            .ilike("patient_phone", `%${cleaned.slice(-9)}%`)
            .neq("status", "completed")
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (data) {
            setStudentSessionId(data.id);
            return true;
          }
        } catch (err) {
          console.warn("Resume session query notice:", err);
        }
        return false;
      },
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
            if (error)
              console.error(
                "Supabase consultation insert failed:",
                error.message,
              );
          } catch (err) {
            console.warn("Supabase session sync notice:", err);
          }
        })();

        return session.id;
      },
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
          await supabase
            .from("consultations")
            .update({
              mpesa_code: mpesaCode,
              payment_phone: paymentPhone,
              payment_status: "pending",
            })
            .eq("id", id);
        } catch (err) {
          console.error("Failed to submit payment claim:", err);
        }
      },
      confirmPayment: async (id) => {
        const s = state.sessions.find((x) => x.id === id);
        const receipt =
          s?.mpesa_code || "POCHI-" + uid().toUpperCase().slice(0, 8);
        dispatch({ type: "mark_paid", id, receipt });
        dispatch({
          type: "patch_session",
          id,
          patch: { payment_status: "confirmed", status: "waiting", paid: true },
        });
        system(id, `Payment confirmed by clinician. Consultation queued.`);
        try {
          await supabase
            .from("consultations")
            .update({
              status: "waiting",
              payment_status: "confirmed",
            })
            .eq("id", id);
        } catch (err) {
          console.error("Failed to confirm payment in Supabase:", err);
        }
      },
      rejectPayment: async (id) => {
        dispatch({
          type: "patch_session",
          id,
          patch: {
            payment_status: "rejected",
            status: "awaiting_payment",
            paid: false,
          },
        });
        system(
          id,
          `Payment reference could not be verified. Please check and resubmit.`,
        );
        try {
          await supabase
            .from("consultations")
            .update({
              payment_status: "rejected",
              status: "payment_pending",
            })
            .eq("id", id);
        } catch (err) {
          console.error("Failed to reject payment:", err);
        }
      },
      simulatePayment: (id) => {
        const receipt = "Q" + uid().toUpperCase().slice(0, 9);
        dispatch({ type: "mark_paid", id, receipt });
        const s = state.sessions.find((x) => x.id === id);
        system(
          id,
          `Payment of KSh ${CONSULT_FEE_KES} received. Receipt ${receipt}.`,
        );
        if (s) {
          const t = triage(s.symptom_codes);
          if (t.emergency) {
            system(
              id,
              "EMERGENCY TRIAGE: the selected symptoms are red flags. This file is marked urgent for the doctor.",
            );
          }
          if (t.labRecommended) {
            dispatch({
              type: "patch_session",
              id,
              patch: { lab_test_requested: true },
            });
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
        dispatch({
          type: "patch_session",
          id,
          patch: { diagnosis_notes: notes },
        }),
      toggleLabTest: (id) => {
        const s = state.sessions.find((x) => x.id === id);
        const value = !s?.lab_test_requested;
        dispatch({
          type: "patch_session",
          id,
          patch: { lab_test_requested: value },
        });
        system(
          id,
          value
            ? "Doctor requested a lab test for this file. Please choose doorstep collection or visit a lab below."
            : "Lab test request withdrawn.",
        );
        (async () => {
          try {
            await supabase
              .from("consultations")
              .update({ lab_test_requested: value })
              .eq("id", id);
          } catch (err) {
            console.error("Failed to toggle lab in Supabase:", err);
          }
        })();
      },
      submitLabOrder: async (id, order) => {
        dispatch({
          type: "patch_session",
          id,
          patch: { lab_order: order },
        });
        const methodLabel =
          order.collection_method === "doorstep"
            ? `Doorstep collection scheduled for ${order.scheduled_date} (${order.scheduled_time}) at ${order.collection_address}`
            : "Lab referral chosen. Visit the selected facility.";
        system(
          id,
          `Lab order confirmed: ${order.panels.join(", ")}. ${methodLabel}`,
        );
        try {
          await supabase
            .from("consultations")
            .update({
              lab_order: order as unknown as Record<string, unknown>,
            })
            .eq("id", id);
        } catch (err) {
          console.error("Failed to save lab order:", err);
        }
      },
      endWithPrescription: (id, prescription) => {
        dispatch({
          type: "patch_session",
          id,
          patch: {
            prescription,
            referral: null,
            status: "completed",
            ended_at: now(),
          },
        });
        system(
          id,
          "Consultation completed. A digital prescription has been signed and issued.",
        );
        (async () => {
          try {
            await supabase
              .from("consultations")
              .update({
                prescription: prescription as unknown as Record<
                  string,
                  unknown
                >,
                referral: null,
                status: "completed",
                ended_at: now(),
              })
              .eq("id", id);
          } catch (err) {
            console.error("Failed to end session with Rx:", err);
          }
        })();
      },
      endWithReferral: (id, referral) => {
        dispatch({
          type: "patch_session",
          id,
          patch: {
            referral,
            prescription: null,
            status: "completed",
            ended_at: now(),
          },
        });
        system(
          id,
          "Consultation completed. An official referral letter has been signed and issued.",
        );
        (async () => {
          try {
            await supabase
              .from("consultations")
              .update({
                referral: referral as unknown as Record<string, unknown>,
                prescription: null,
                status: "completed",
                ended_at: now(),
              })
              .eq("id", id);
          } catch (err) {
            console.error("Failed to end session with Referral:", err);
          }
        })();
      },
    };
  }, [
    state,
    studentSessionId,
    setStudentSessionId,
    clearActiveSession,
    sendMessage,
  ]);

  return (
    <ClinicContext.Provider value={api}>{children}</ClinicContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useClinic() {
  const ctx = useContext(ClinicContext);
  if (!ctx) throw new Error("useClinic must be used inside <ClinicProvider>");
  return ctx;
}