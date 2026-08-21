// Patient authentication via Supabase Auth email OTP (6-digit code).
// Degrades gracefully when Supabase env vars are not configured: methods
// surface a human-readable error instead of crashing the app.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { isSupabaseConfigured, supabase } from "./supabase";

export interface PatientUser {
  id: string;
  email: string | null;
}

interface PatientAuthApi {
  /** Currently signed-in patient, or null. */
  patient: PatientUser | null;
  /** True while the initial session restore is in flight. */
  loading: boolean;
  /** True when VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are set. */
  configured: boolean;
  /** Sends a 6-digit OTP code to the given email. Returns an error message or null. */
  requestEmailOtp: (email: string) => Promise<string | null>;
  /** Verifies the OTP code. Returns an error message or null on success. */
  verifyEmailOtp: (email: string, code: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

const PatientAuthContext = createContext<PatientAuthApi | null>(null);

const NOT_CONFIGURED_MESSAGE =
  "Patient accounts are not available yet: the clinic backend (Supabase) is not configured.";

export function PatientAuthProvider({ children }: { children: ReactNode }) {
  const [patient, setPatient] = useState<PatientUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (cancelled) return;
        const user = data.session?.user;
        setPatient(user ? { id: user.id, email: user.email ?? null } : null);
      })
      .catch((err) => {
        console.warn("Patient session restore notice:", err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user;
      setPatient(user ? { id: user.id, email: user.email ?? null } : null);
    });

    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const requestEmailOtp = useCallback(async (email: string): Promise<string | null> => {
    if (!isSupabaseConfigured) return NOT_CONFIGURED_MESSAGE;
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: { shouldCreateUser: true },
      });
      return error ? error.message : null;
    } catch (err) {
      console.error("OTP request failed:", err);
      return "Could not send the verification code. Please try again.";
    }
  }, []);

  const verifyEmailOtp = useCallback(
    async (email: string, code: string): Promise<string | null> => {
      if (!isSupabaseConfigured) return NOT_CONFIGURED_MESSAGE;
      try {
        const { data, error } = await supabase.auth.verifyOtp({
          email: email.trim().toLowerCase(),
          token: code.trim(),
          type: "email",
        });
        if (error) return error.message;
        const user = data.user;
        setPatient(user ? { id: user.id, email: user.email ?? null } : null);
        return null;
      } catch (err) {
        console.error("OTP verification failed:", err);
        return "Verification failed. Please check the code and try again.";
      }
    },
    [],
  );

  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn("Sign-out notice:", err);
    }
    setPatient(null);
  }, []);

  const api = useMemo<PatientAuthApi>(
    () => ({
      patient,
      loading,
      configured: isSupabaseConfigured,
      requestEmailOtp,
      verifyEmailOtp,
      signOut,
    }),
    [patient, loading, requestEmailOtp, verifyEmailOtp, signOut],
  );

  return <PatientAuthContext.Provider value={api}>{children}</PatientAuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePatientAuth() {
  const ctx = useContext(PatientAuthContext);
  if (!ctx) throw new Error("usePatientAuth must be used inside <PatientAuthProvider>");
  return ctx;
}
