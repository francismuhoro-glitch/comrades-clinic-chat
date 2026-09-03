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
import { sendNotification } from "./notifications";
import { finalTriageLevel, summarizeSmartTriage, type SmartTriageAnswers } from "./smart-triage";
import { supabase } from "./supabase";
import { mapConsultationRow, type ConsultationRow } from "./consultation-mapper";

import { triage } from "./triage";
import {
  CONSULT_FEE_KES,
  FALLBACK_LAB_CATALOG,
  LAB_ORDER_STATUS_LABELS,
  LAB_RESULT_STAGE_LABELS,
  THERAPY_FEE_KES,
  type ChatMessage,
  type ClinicSettings,
  type ConsultationMode,
  type ConsultationType,
  type ConsultSession,
  type LabOrder,
  type LabOrderStatus,
  type LabResult,
  type LabResultStage,
  type LabTestCatalogItem,
  type Prescription,
  type Referral,
  type Sender,
} from "./clinic-types";

const uid = () =>
  typeof globalThis.crypto?.randomUUID === "function"
    ? globalThis.crypto.randomUUID()
    : `${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 10)}-4000-8000-${Math.random().toString(16).slice(2, 14)}`;
const now = () => new Date().toISOString();

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
  labResults: LabResult[];
  labCatalog: LabTestCatalogItem[];
}

type Action =
  | { type: "set_online"; value: boolean }
  | { type: "set_settings"; settings: ClinicSettings }
  | { type: "create_session"; session: ConsultSession }
  | { type: "mark_paid"; id: string; receipt: string }
  | { type: "activate"; id: string }
  | { type: "add_message"; message: ChatMessage }
  | { type: "patch_session"; id: string; patch: Partial<ConsultSession> }
  | { type: "set_lab_results"; results: LabResult[] }
  | { type: "set_lab_catalog"; catalog: LabTestCatalogItem[] }
  | { type: "add_lab_result"; result: LabResult }
  | { type: "patch_lab_result"; id: string; patch: Partial<LabResult> }
  | { type: "delete_lab_result"; id: string };

function seed(): State {
  // Demo patients removed — live queue is Supabase-only (owner request Aug 2026).
  // Keeps the app deterministic and avoids polluting analytics.
  return {
    doctorOnline: true,
    settings: DEFAULT_SETTINGS,
    sessions: [],
    messages: [],
    labResults: [],
    labCatalog: FALLBACK_LAB_CATALOG,
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
    case "set_lab_results":
      return { ...state, labResults: action.results };
    case "set_lab_catalog":
      return { ...state, labCatalog: action.catalog };
    case "add_lab_result":
      if (state.labResults.some((r) => r.id === action.result.id)) {
        return {
          ...state,
          labResults: state.labResults.map((r) => (r.id === action.result.id ? action.result : r)),
        };
      }
      return { ...state, labResults: [...state.labResults, action.result] };
    case "patch_lab_result":
      return {
        ...state,
        labResults: state.labResults.map((r) =>
          r.id === action.id ? { ...r, ...action.patch } : r,
        ),
      };
    case "delete_lab_result":
      return {
        ...state,
        labResults: state.labResults.filter((r) => r.id !== action.id),
      };
    default:
      return state;
  }
}

export interface IntakeInput {
  full_name: string;
  phone: string;
  patient_email?: string | undefined;
  campus: string;
  symptoms: string;
  symptom_codes: string[];
  /** Consultation preference picked at registration: text chat or voice/video call. */
  consultation_mode: ConsultationMode;
  /** Smart-triage follow-up answers from the intake's quick questions. */
  triage_answers?: SmartTriageAnswers | null | undefined;
  /** Optional referral code entered at intake (e.g. BRI7X2A). */
  referral_code?: string | null | undefined;
  /** Type of consultation: general or therapy. */
  consultation_type?: ConsultationType | undefined;
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
  resumeSessionByPhone: (phoneOrEmail: string) => Promise<boolean>;
  clearActiveSession: () => void;
  submitPaymentClaim: (id: string, mpesaCode: string, paymentPhone: string) => Promise<void>;
  confirmPayment: (id: string) => Promise<void>;
  rejectPayment: (id: string) => Promise<void>;
  submitLabOrder: (id: string, order: LabOrder) => Promise<void>;
  /** Patient declines the doctor's lab request (with an optional reason). */
  declineLabOrder: (id: string, reason?: string) => Promise<void>;
  /** Patient reopens the collection choice (e.g. after declining or to change plans). */
  reopenLabChoice: (id: string) => Promise<void>;
  /** Doctor advances the lab order through its fulfilment pipeline. */
  updateLabOrderStatus: (id: string, status: LabOrderStatus) => Promise<void>;
  simulatePayment: (id: string) => void;
  activateSession: (id: string) => void;
  sendMessage: (id: string, sender: "student" | "doctor", body: string) => void;
  setDiagnosisNotes: (id: string, notes: string) => void;
  toggleLabTest: (id: string) => void;
  endWithPrescription: (id: string, prescription: Prescription) => void;
  endWithReferral: (id: string, referral: Referral) => void;
  /** Lab results and catalog functionality */
  labCatalog: LabTestCatalogItem[];
  labResultsFor: (consultationId: string | null) => LabResult[];
  addLabResult: (input: Omit<LabResult, "id" | "created_at" | "updated_at">) => Promise<void>;
  updateLabResultStage: (id: string, stage: LabResultStage) => Promise<void>;
  updateBulkLabResultStage: (ids: string[], stage: LabResultStage) => Promise<void>;
  deleteLabResult: (id: string) => Promise<void>;
}

const ClinicContext = createContext<ClinicApi | null>(null);

export function ClinicProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, seed);

  // Auto-restore session ID from localStorage across browser restarts
  const [studentSessionId, setStudentSessionIdState] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("comrades_active_session_id") || null;
    }
    return null;
  });

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

  // Persist any chat message (student/doctor/system) to Supabase, encrypted.
  const persistMessage = useCallback(
    (msgId: string, sessionId: string, sender: Sender, body: string, createdAt: string) => {
      (async () => {
        try {
          const encryptedContent = await encryptMessage(body, sessionId);
          const { error } = await supabase.from("messages").insert({
            id: msgId,
            consultation_id: sessionId,
            sender_role: sender === "student" ? "patient" : sender,
            sender_name:
              sender === "doctor" ? "Doctor" : sender === "system" ? "System" : "Student",
            content: encryptedContent,
            created_at: createdAt,
          });
          if (error) console.error("Supabase message insert failed:", error.message);
        } catch (err) {
          console.warn("Supabase message sync notice:", err);
        }
      })();
    },
    [],
  );

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

      persistMessage(msgId, id, sender, body, createdAt);
    },
    [persistMessage],
  );

  // System messages must reach BOTH sides (doctor and patient), so they are
  // dispatched locally and synced through Supabase like any other message.
  const sendSystemMessage = useCallback(
    (id: string, body: string) => {
      const msgId = uid();
      const createdAt = now();
      dispatch({
        type: "add_message",
        message: {
          id: msgId,
          session_id: id,
          sender: "system",
          body,
          created_at: createdAt,
        },
      });
      persistMessage(msgId, id, "system", body, createdAt);
    },
    [persistMessage],
  );

  // Realtime Supabase subscription for live chat, queue sync, and lab results
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
              pochi_phone: settingsData.pochi_phone || DEFAULT_SETTINGS.pochi_phone,
              pochi_name: settingsData.pochi_name || DEFAULT_SETTINGS.pochi_name,
              helpline_phone: settingsData.helpline_phone || DEFAULT_SETTINGS.helpline_phone,
              consultation_fee_kes:
                settingsData.consultation_fee_kes || DEFAULT_SETTINGS.consultation_fee_kes,
            },
          });
        }

        // Fetch lab catalog
        try {
          const { data: catalogData } = await supabase
            .from("lab_test_catalog")
            .select("*")
            .eq("active", true);
          if (catalogData && catalogData.length > 0) {
            dispatch({ type: "set_lab_catalog", catalog: catalogData as LabTestCatalogItem[] });
          }
        } catch (err) {
          console.warn("Lab catalog initial load notice:", err);
        }

        // Fetch consultations
        const { data } = await supabase
          .from("consultations")
          .select("*")
          .order("created_at", { ascending: false });

        if (data && data.length > 0) {
          for (const row of data as ConsultationRow[]) {
            dispatch({ type: "create_session", session: mapConsultationRow(row) });
          }
        }

        // Fetch lab results
        try {
          const { data: labData } = await supabase
            .from("lab_results")
            .select("*")
            .order("created_at", { ascending: true });
          if (labData && labData.length > 0) {
            dispatch({ type: "set_lab_results", results: labData as LabResult[] });
          }
        } catch (err) {
          console.warn("Lab results initial load notice:", err);
        }

        // Restore chat history
        const { data: messageRows } = await supabase
          .from("messages")
          .select("*")
          .order("created_at", { ascending: true })
          .limit(1000);

        if (messageRows && messageRows.length > 0) {
          for (const raw of messageRows as {
            id: string;
            consultation_id: string;
            sender_role: "patient" | "doctor" | "system";
            content: string;
            created_at: string | null;
          }[]) {
            if (!raw.id || !raw.consultation_id) continue;
            const body = await decryptMessage(raw.content, raw.consultation_id);
            dispatch({
              type: "add_message",
              message: {
                id: raw.id,
                session_id: raw.consultation_id,
                sender: raw.sender_role === "patient" ? "student" : (raw.sender_role ?? "system"),
                body,
                created_at: raw.created_at || now(),
              },
            });
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
          const row = payload.new as ConsultationRow;
          if (!row || !row.id) return;
          dispatch({ type: "create_session", session: mapConsultationRow(row) });
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
            lab_order?: LabOrder | null;
            payment_status?: "pending" | "confirmed" | "rejected";
            lab_test_requested?: boolean;
            patient_email?: string | null;
            video_room_name?: string | null;
            consultation_mode?: string | null;
            referral_code_used?: string | null;
            referral_discount_kes?: number | null;
            referred_by_profile_id?: string | null;
            activated_at?: string | null;
            ended_at?: string | null;
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
            paid:
              row.payment_status === "confirmed" ||
              row.status === "waiting" ||
              row.status === "active" ||
              row.status === "completed",
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
          if (row.lab_order !== undefined) {
            patch.lab_order = row.lab_order;
          }
          if (row.payment_status) {
            patch.payment_status = row.payment_status;
          }
          if (typeof row.lab_test_requested === "boolean") {
            patch.lab_test_requested = row.lab_test_requested;
          }
          if (row.patient_email !== undefined) {
            patch.patient_email = row.patient_email;
          }
          if (row.video_room_name !== undefined) {
            patch.video_room_name = row.video_room_name;
          }
          if (row.consultation_mode !== undefined) {
            patch.consultation_mode = row.consultation_mode === "video" ? "video" : "chat";
          }
          if (row.referral_code_used !== undefined) {
            patch.referral_code_used = row.referral_code_used;
          }
          if (row.referral_discount_kes !== undefined) {
            patch.referral_discount_kes = row.referral_discount_kes;
          }
          if (row.referred_by_profile_id !== undefined) {
            patch.referred_by_profile_id = row.referred_by_profile_id;
          }
          if (row.activated_at !== undefined) {
            patch.activated_at = row.activated_at;
          }
          if (row.ended_at !== undefined) {
            patch.ended_at = row.ended_at;
          }

          dispatch({
            type: "patch_session",
            id: row.id,
            patch,
          });
        },
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "lab_results" }, (payload) => {
        if (payload.eventType === "INSERT") {
          const raw = payload.new as LabResult;
          if (raw && raw.id) {
            dispatch({ type: "add_lab_result", result: raw });
          }
        } else if (payload.eventType === "UPDATE") {
          const raw = payload.new as LabResult;
          if (raw && raw.id) {
            dispatch({ type: "patch_lab_result", id: raw.id, patch: raw });
          }
        } else if (payload.eventType === "DELETE") {
          const raw = payload.old as { id?: string };
          if (raw && raw.id) {
            dispatch({ type: "delete_lab_result", id: raw.id });
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const api = useMemo<ClinicApi>(() => {
    // Synced to Supabase so both the doctor and the patient see it.
    const system = sendSystemMessage;

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
        (s) => (s.payment_status === "pending" || s.status === "awaiting_payment") && !s.paid,
      ),
      sessionsByStatus: (status) => state.sessions.filter((s) => s.status === status),
      getSession: (id) => state.sessions.find((s) => s.id === id) ?? null,
      messagesFor: (id) => (id ? state.messages.filter((m) => m.session_id === id) : []),
      studentSessionId,
      setStudentSessionId,
      clearActiveSession,
      resumeSessionByPhone: async (searchTerm: string) => {
        const cleaned = searchTerm.trim().toLowerCase();
        const cleanedPhone = cleaned.replace(/\s/g, "");
        // Search local state first
        const local = state.sessions.find(
          (s) =>
            (s.phone.replace(/\s/g, "").toLowerCase() === cleanedPhone ||
              (s.patient_email && s.patient_email.toLowerCase() === cleaned)) &&
            s.status !== "completed",
        );
        if (local) {
          setStudentSessionId(local.id);
          return true;
        }
        // Search Supabase
        try {
          const searchParam = cleanedPhone.length >= 9 ? cleanedPhone.slice(-9) : cleaned;
          const { data } = await supabase
            .from("consultations")
            .select("*")
            .or(`patient_phone.ilike.%${searchParam}%,patient_email.ilike.${cleaned}`)
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
        const smart = summarizeSmartTriage(input.symptom_codes, input.triage_answers);
        const level = finalTriageLevel(t.level, smart);
        const referralCode = input.referral_code?.trim().toUpperCase() || null;
        const referralDiscount = referralCode ? 50 : 0;
        const consultationType: ConsultationType = input.consultation_type || "general";
        const baseFee = consultationType === "therapy" ? THERAPY_FEE_KES : CONSULT_FEE_KES;
        const session: ConsultSession = {
          id: uid(),
          full_name: input.full_name,
          phone: input.phone,
          patient_email: input.patient_email ?? null,
          campus: input.campus,
          symptoms: input.symptoms,
          symptom_codes: input.symptom_codes,
          triage_level: level,
          emergency_flag: level === "emergency",
          suggested_labs: t.labPanels,
          status: "awaiting_payment",
          consultation_mode: input.consultation_mode,
          paid: false,
          fee_kes: baseFee - referralDiscount,
          mpesa_receipt: null,
          lab_test_requested: false,
          diagnosis_notes: "",
          prescription: null,
          referral: null,
          referral_code_used: referralCode,
          referral_discount_kes: referralDiscount || null,
          consultation_type: consultationType,
          created_at: now(),
          ended_at: null,
        };
        dispatch({ type: "create_session", session });
        setStudentSessionId(session.id);

        (async () => {
          try {
            // Attach the logged-in patient account (if any) so this visit
            // shows up under "My Visits" on any device.
            let patientId: string | null = null;
            let accountEmail: string | null = input.patient_email ?? null;
            try {
              const { data } = await supabase.auth.getUser();
              patientId = data.user?.id ?? null;
              if (!accountEmail && data.user?.email) {
                accountEmail = data.user.email;
              }
            } catch {
              patientId = null;
            }

            // Try to resolve referrer profile for referral tracking
            let referredById: string | null = null;
            if (referralCode) {
              try {
                const { data: refProfile } = await supabase
                  .from("profiles")
                  .select("id")
                  .ilike("referral_code", referralCode)
                  .maybeSingle();
                if (refProfile && refProfile.id !== patientId) {
                  referredById = refProfile.id;
                }
              } catch {
                referredById = null;
              }
            }

            const { error } = await supabase.from("consultations").insert({
              id: session.id,
              patient_name: input.full_name,
              patient_phone: input.phone,
              patient_email: accountEmail,
              campus: input.campus,
              symptoms_description: input.symptoms,
              symptoms_selected: input.symptom_codes,
              triage_level: level,
              status: "payment_pending",
              consultation_mode: input.consultation_mode,
              consultation_type: consultationType,
              fee_kes: baseFee,
              ...(input.triage_answers ? { triage_answers: input.triage_answers } : {}),
              ...(patientId ? { patient_id: patientId } : {}),
              ...(referralCode ? { referral_code_used: referralCode } : {}),
              ...(referralDiscount ? { referral_discount_kes: referralDiscount } : {}),
              ...(referredById ? { referred_by_profile_id: referredById } : {}),
            });
            if (error) {
              console.error("Supabase consultation insert failed:", error.message);
            } else {
              // Tell the clinic a new file just landed in the queue.
              void sendNotification({
                audience: "doctor",
                consultationId: session.id,
                type: "queue.new",
                title: `New patient: ${input.full_name}`,
                body: `${input.campus} · triage: ${t.level}${
                  input.consultation_mode === "video" ? " · wants voice/video" : ""
                }${referralCode ? ` · ref ${referralCode}` : ""}`,
              });

              // Record referral if code was used
              if (referralCode && referredById) {
                try {
                  await supabase.from("referrals").insert({
                    code: referralCode,
                    referrer_profile_id: referredById,
                    referred_profile_id: patientId,
                    referred_consultation_id: session.id,
                    discount_kes: referralDiscount,
                    reward_kes: 30,
                    status: "pending",
                  });
                } catch (refErr) {
                  console.warn("Referral record notice:", refErr);
                }
              }
            }
            // Email backup for the doctor (no-op when Brevo isn't configured).
            void (async () => {
              try {
                const { notifyDoctorNewPatient } = await import("./doctor-email-alerts");
                await notifyDoctorNewPatient({
                  data: {
                    patientName: input.full_name,
                    campus: input.campus,
                    triage: level,
                    mode: input.consultation_mode,
                    consultationType,
                  },
                });
              } catch (emailErr) {
                console.warn("Doctor email alert notice:", emailErr);
              }
            })();
          } catch (err) {
            console.warn("Supabase session sync notice:", err);
          }
        })();

        return session.id;
      },
      submitPaymentClaim: async (id, mpesaCode, paymentPhone) => {
        const claimed = state.sessions.find((x) => x.id === id);
        void sendNotification({
          audience: "doctor",
          consultationId: id,
          type: "payment.pending",
          title: "Payment to verify",
          body: `${claimed?.full_name ?? "A patient"} submitted ${mpesaCode} (KSh ${claimed?.fee_kes ?? CONSULT_FEE_KES}).`,
        });
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
          // Email backup for the doctor (no-op when Brevo isn't configured).
          void (async () => {
            try {
              const { notifyDoctorPaymentClaim } = await import("./doctor-email-alerts");
              await notifyDoctorPaymentClaim({
                data: {
                  patientName: claimed?.full_name ?? "A patient",
                  mpesaCode,
                  phone: paymentPhone || undefined,
                  amountKes: claimed?.fee_kes ?? CONSULT_FEE_KES,
                  consultationType: claimed?.consultation_type ?? "general",
                },
              });
            } catch (emailErr) {
              console.warn("Doctor email alert notice:", emailErr);
            }
          })();
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
        void sendNotification({
          audience: "patient",
          recipientId: s?.patient_id ?? null,
          consultationId: id,
          type: "payment.confirmed",
          title: "Payment confirmed ✅",
          body: "You're in the queue — we'll alert you the moment the doctor joins.",
        });
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
        const rejected = state.sessions.find((x) => x.id === id);
        void sendNotification({
          audience: "patient",
          recipientId: rejected?.patient_id ?? null,
          consultationId: id,
          type: "payment.rejected",
          title: "Payment not verified",
          body: "We couldn't match your M-Pesa code. Please check it and resubmit.",
        });
        dispatch({
          type: "patch_session",
          id,
          patch: {
            payment_status: "rejected",
            status: "awaiting_payment",
            paid: false,
          },
        });
        system(id, `Payment reference could not be verified. Please check and resubmit.`);
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
        system(id, `Payment of KSh ${s?.fee_kes ?? CONSULT_FEE_KES} received. Receipt ${receipt}.`);
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
      activateSession: (id) => {
        const target = state.sessions.find((s) => s.id === id);
        if (!target || target.status !== "waiting") return;
        dispatch({ type: "activate", id });
        system(id, "Consultation started — the doctor is ready for you.");
        void sendNotification({
          audience: "patient",
          recipientId: target.patient_id ?? null,
          consultationId: id,
          type: "doctor.ready",
          title: "Your doctor is ready 🩺",
          body: "Open My Visits to join the consultation now.",
        });
        (async () => {
          try {
            const activatedAt = now();
            await supabase
              .from("consultations")
              .update({ status: "active", activated_at: activatedAt })
              .eq("id", id);
          } catch (err) {
            console.error("Failed to activate consultation in Supabase:", err);
          }
        })();
      },
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
          // Re-requesting clears any previous (e.g. declined) order so the
          // patient gets a fresh choice card.
          patch: value
            ? { lab_test_requested: value, lab_order: null }
            : { lab_test_requested: value },
        });
        system(
          id,
          value
            ? "Doctor requested a lab test for this file. Please choose doorstep collection or visit a lab below — or decline if you prefer."
            : "Lab test request withdrawn.",
        );
        (async () => {
          try {
            await supabase
              .from("consultations")
              .update(
                value
                  ? { lab_test_requested: value, lab_order: null }
                  : { lab_test_requested: value },
              )
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
        system(id, `Lab order confirmed: ${order.panels.join(", ")}. ${methodLabel}`);
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
      declineLabOrder: async (id, reason) => {
        const s = state.sessions.find((x) => x.id === id);
        const order: LabOrder = {
          panels: s?.suggested_labs?.length ? s.suggested_labs : [],
          status: "declined",
          ...(reason?.trim() ? { decline_reason: reason.trim() } : {}),
        };
        dispatch({ type: "patch_session", id, patch: { lab_order: order } });
        system(
          id,
          `Patient declined the lab test${reason?.trim() ? `: "${reason.trim()}"` : "."} The doctor has been notified.`,
        );
        try {
          await supabase
            .from("consultations")
            .update({ lab_order: order as unknown as Record<string, unknown> })
            .eq("id", id);
        } catch (err) {
          console.error("Failed to decline lab order:", err);
        }
      },
      reopenLabChoice: async (id) => {
        dispatch({ type: "patch_session", id, patch: { lab_order: null } });
        try {
          await supabase.from("consultations").update({ lab_order: null }).eq("id", id);
        } catch (err) {
          console.error("Failed to reopen lab choice:", err);
        }
      },
      updateLabOrderStatus: async (id, status) => {
        const s = state.sessions.find((x) => x.id === id);
        if (!s?.lab_order) return;
        const order: LabOrder = { ...s.lab_order, status };
        dispatch({ type: "patch_session", id, patch: { lab_order: order } });
        system(id, `Lab order update: ${LAB_ORDER_STATUS_LABELS[status]}.`);
        void sendNotification({
          audience: "patient",
          recipientId: s?.patient_id ?? null,
          consultationId: id,
          type: "lab.update",
          title: "Lab update",
          body: `${s.lab_order.panels[0] ?? "Your test"}: ${LAB_ORDER_STATUS_LABELS[status]}.`,
        });
        try {
          await supabase
            .from("consultations")
            .update({ lab_order: order as unknown as Record<string, unknown> })
            .eq("id", id);
        } catch (err) {
          console.error("Failed to update lab order status:", err);
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
        system(id, "Consultation completed. A digital prescription has been signed and issued.");
        void sendNotification({
          audience: "patient",
          recipientId: state.sessions.find((x) => x.id === id)?.patient_id ?? null,
          consultationId: id,
          type: "prescription.ready",
          title: "Prescription ready 💊",
          body: "Your signed prescription is available in My Visits.",
        });
        (async () => {
          try {
            await supabase
              .from("consultations")
              .update({
                prescription: prescription as unknown as Record<string, unknown>,
                referral: null,
                status: "completed",
                ended_at: now(),
              })
              .eq("id", id);

            // Award referral credit if this consult was referred
            try {
              const { awardReferralIfNeeded } = await import("./referrals");
              await awardReferralIfNeeded({ data: { consultation_id: id } });
            } catch (refErr) {
              console.warn("Referral award notice:", refErr);
            }
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
        void sendNotification({
          audience: "patient",
          recipientId: state.sessions.find((x) => x.id === id)?.patient_id ?? null,
          consultationId: id,
          type: "referral.ready",
          title: "Referral letter ready 🏥",
          body: `Referral to ${referral.destination} is ready in My Visits.`,
        });
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

            // Award referral credit if this consult was referred
            try {
              const { awardReferralIfNeeded } = await import("./referrals");
              await awardReferralIfNeeded({ data: { consultation_id: id } });
            } catch (refErr) {
              console.warn("Referral award notice:", refErr);
            }
          } catch (err) {
            console.error("Failed to end session with Referral:", err);
          }
        })();
      },

      // Lab Results & Catalog API
      labCatalog: state.labCatalog,
      labResultsFor: (consultationId) =>
        consultationId ? state.labResults.filter((r) => r.consultation_id === consultationId) : [],
      addLabResult: async (input) => {
        const newId = uid();
        const timestamp = now();
        const result: LabResult = {
          ...input,
          id: newId,
          created_at: timestamp,
          updated_at: timestamp,
        };
        dispatch({ type: "add_lab_result", result });
        system(
          input.consultation_id,
          `New lab test entry added: ${input.panel} (${input.loinc_code || "Manual"}). Stage: ${LAB_RESULT_STAGE_LABELS[input.stage]}.`,
        );
        void sendNotification({
          audience: "patient",
          consultationId: input.consultation_id,
          type: "lab.update",
          title: "Lab results update",
          body: `${input.panel}: ${LAB_RESULT_STAGE_LABELS[input.stage]}.`,
        });
        try {
          await supabase.from("lab_results").insert({
            id: newId,
            consultation_id: input.consultation_id,
            panel: input.panel,
            result_value: input.result_value,
            unit: input.unit,
            reference_range: input.reference_range,
            flag: input.flag,
            notes: input.notes,
            stage: input.stage,
            loinc_code: input.loinc_code,
            loinc_display: input.loinc_display,
            created_at: timestamp,
            updated_at: timestamp,
          });
        } catch (err) {
          console.error("Failed to insert lab result:", err);
        }
      },
      updateLabResultStage: async (id, stage) => {
        const existing = state.labResults.find((r) => r.id === id);
        if (!existing) return;
        const timestamp = now();
        dispatch({ type: "patch_lab_result", id, patch: { stage, updated_at: timestamp } });
        system(
          existing.consultation_id,
          `Lab result stage update (${existing.panel}): ${LAB_RESULT_STAGE_LABELS[stage]}.`,
        );
        try {
          await supabase.from("lab_results").update({ stage, updated_at: timestamp }).eq("id", id);
        } catch (err) {
          console.error("Failed to update lab result stage:", err);
        }
      },
      updateBulkLabResultStage: async (ids, stage) => {
        if (ids.length === 0) return;
        const timestamp = now();
        for (const id of ids) {
          dispatch({ type: "patch_lab_result", id, patch: { stage, updated_at: timestamp } });
        }
        const first = state.labResults.find((r) => ids.includes(r.id));
        if (first) {
          system(
            first.consultation_id,
            `Bulk lab results update (${ids.length} tests): ${LAB_RESULT_STAGE_LABELS[stage]}.`,
          );
        }
        try {
          await supabase.from("lab_results").update({ stage, updated_at: timestamp }).in("id", ids);
        } catch (err) {
          console.error("Failed to bulk update lab result stage:", err);
        }
      },
      deleteLabResult: async (id) => {
        dispatch({ type: "delete_lab_result", id });
        try {
          await supabase.from("lab_results").delete().eq("id", id);
        } catch (err) {
          console.error("Failed to delete lab result:", err);
        }
      },
    };
  }, [
    state,
    studentSessionId,
    setStudentSessionId,
    clearActiveSession,
    sendMessage,
    sendSystemMessage,
  ]);

  return <ClinicContext.Provider value={api}>{children}</ClinicContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useClinic() {
  const ctx = useContext(ClinicContext);
  if (!ctx) throw new Error("useClinic must be used inside <ClinicProvider>");
  return ctx;
}
