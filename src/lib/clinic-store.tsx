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
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from "react";

import {
  CONSULT_FEE_KES,
  type ChatMessage,
  type ConsultSession,
  type Prescription,
  type Referral,
} from "./clinic-types";

const uid = () => Math.random().toString(36).slice(2, 10);
const now = () => new Date().toISOString();
const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();

interface State {
  doctorOnline: boolean;
  sessions: ConsultSession[];
  messages: ChatMessage[];
}

type Action =
  | { type: "set_online"; value: boolean }
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
    case "create_session":
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
}

interface ClinicApi {
  doctorOnline: boolean;
  setDoctorOnline: (value: boolean) => void;
  sessions: ConsultSession[];
  sessionsByStatus: (status: ConsultSession["status"]) => ConsultSession[];
  getSession: (id: string | null) => ConsultSession | null;
  messagesFor: (id: string | null) => ChatMessage[];
  /** Current student's session id (the person using the phone). */
  studentSessionId: string | null;
  setStudentSessionId: (id: string | null) => void;
  createSession: (input: IntakeInput) => string;
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

  const sendMessage = useCallback(
    (id: string, sender: "student" | "doctor", body: string) => {
      dispatch({
        type: "add_message",
        message: { id: uid(), session_id: id, sender, body, created_at: now() },
      });
    },
    [],
  );

  const api = useMemo<ClinicApi>(() => {
    const system = (id: string, body: string) =>
      dispatch({
        type: "add_message",
        message: { id: uid(), session_id: id, sender: "system", body, created_at: now() },
      });

    return {
      doctorOnline: state.doctorOnline,
      setDoctorOnline: (value) => dispatch({ type: "set_online", value }),
      sessions: state.sessions,
      sessionsByStatus: (status) => state.sessions.filter((s) => s.status === status),
      getSession: (id) => state.sessions.find((s) => s.id === id) ?? null,
      messagesFor: (id) =>
        id ? state.messages.filter((m) => m.session_id === id) : [],
      studentSessionId,
      setStudentSessionId,
      createSession: (input) => {
        const session: ConsultSession = {
          id: uid(),
          full_name: input.full_name,
          phone: input.phone,
          campus: input.campus,
          symptoms: input.symptoms,
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
        return session.id;
      },
      simulatePayment: (id) => {
        const receipt = "Q" + uid().toUpperCase().slice(0, 9);
        dispatch({ type: "mark_paid", id, receipt });
        const s = state.sessions.find((x) => x.id === id);
        system(id, `Payment of KSh ${CONSULT_FEE_KES} received. Receipt ${receipt}.`);
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

export function useClinic() {
  const ctx = useContext(ClinicContext);
  if (!ctx) throw new Error("useClinic must be used inside <ClinicProvider>");
  return ctx;
}
