import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  Gift,
  History,
  Link2,
  LoaderCircle,
  LogOut,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import {
  DocumentActions,
  PrescriptionTemplate,
  ReferralTemplate,
} from "@/components/clinic/DocumentTemplates";
import { LabResultsTracker } from "@/components/clinic/LabResultsTracker";
import { StatusBadge, StudentLayout } from "@/components/clinic/StudentLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LAB_ORDER_STATUS_LABELS, type ConsultSession, type LabResult } from "@/lib/clinic-types";
import { mapConsultationRow, type ConsultationRow } from "@/lib/consultation-mapper";
import { usePatientAuth } from "@/lib/patient-auth";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/visits")({
  head: () => ({
    meta: [
      { title: "My Visits — Comrades Clinic" },
      {
        name: "description",
        content:
          "Sign in with your email to view your full consultation history, prescriptions, referrals, and lab orders from any device.",
      },
    ],
  }),
  component: VisitsRouteComponent,
});

function formatVisitDate(iso: string) {
  return new Date(iso).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" });
}

function LoginCard() {
  const { requestEmailOtp, verifyEmailOtp, configured } = usePatientAuth();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const err = await requestEmailOtp(email);
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    setInfo(`We sent a 6-digit code to ${email.trim()}. Check your inbox (and spam folder).`);
    setStep("code");
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const err = await verifyEmailOtp(email, code);
    setBusy(false);
    if (err) setError(err);
  };

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-card space-y-4">
      <div className="space-y-1">
        <h2 className="text-base font-bold flex items-center gap-2">
          <ShieldCheck className="size-4 text-primary" />
          Patient Sign-In
        </h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Sign in with your email to see every visit, prescription, referral, and lab order — even
          after clearing your browser or switching phones. No password needed: we email you a
          one-time code.
        </p>
      </div>

      {!configured && (
        <p className="rounded-lg border border-warning bg-warning/10 p-2.5 text-xs text-warning-foreground">
          Patient accounts require the clinic backend (Supabase) to be configured by the
          administrator. Until then, you can still resume an active consultation from the home page
          using your phone number or email.
        </p>
      )}

      {step === "email" ? (
        <form onSubmit={handleRequest} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="login-email">Email address</Label>
            <Input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. comrade@students.ku.ac.ke"
              required
            />
          </div>
          {error && <p className="text-xs font-medium text-destructive">{error}</p>}
          <Button type="submit" className="w-full gap-2" disabled={busy || !configured}>
            {busy ? <LoaderCircle className="size-4 animate-spin" /> : <Mail className="size-4" />}
            {busy ? "Sending code…" : "Email me a sign-in code"}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleVerify} className="space-y-3">
          {info && (
            <p className="rounded-lg bg-primary/5 p-2.5 text-xs text-muted-foreground">{info}</p>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="login-code">6-digit code</Label>
            <Input
              id="login-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              required
            />
          </div>
          {error && <p className="text-xs font-medium text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 text-xs"
              onClick={() => {
                setStep("email");
                setError(null);
                setInfo(null);
              }}
            >
              Change email
            </Button>
            <Button type="submit" className="flex-1 text-xs" disabled={busy}>
              {busy ? "Verifying…" : "Verify & Sign In"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

function VisitCard({ visit }: { visit: ConsultSession }) {
  const [open, setOpen] = useState(false);
  const [labResults, setLabResults] = useState<LabResult[]>([]);
  const [loadingLabs, setLoadingLabs] = useState(false);

  useEffect(() => {
    if (open) {
      setLoadingLabs(true);
      (async () => {
        try {
          const { data } = await supabase
            .from("lab_results")
            .select("*")
            .eq("consultation_id", visit.id)
            .order("created_at", { ascending: true });
          if (data) {
            setLabResults(data as LabResult[]);
          }
        } finally {
          setLoadingLabs(false);
        }
      })();
    }
  }, [open, visit.id]);

  return (
    <div className="rounded-2xl border bg-card shadow-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 p-4 text-left"
      >
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{formatVisitDate(visit.created_at)}</p>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {visit.symptoms || "Consultation"}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge status={visit.status} paid={visit.paid} />
          {open ? (
            <ChevronUp className="size-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {open && (
        <div className="border-t px-4 py-4 space-y-3 text-xs">
          {visit.diagnosis_notes && (
            <div>
              <p className="font-semibold uppercase tracking-wider text-[10px] text-muted-foreground">
                Clinical notes
              </p>
              <p className="mt-1 leading-relaxed whitespace-pre-line">{visit.diagnosis_notes}</p>
            </div>
          )}

          {visit.lab_order && (
            <div className="flex items-start gap-2 rounded-lg bg-warning/10 p-2.5">
              <FlaskConical className="mt-0.5 size-3.5 shrink-0 text-warning" />
              <p>
                <strong>Lab order</strong>
                {visit.lab_order.panels.length > 0 ? `: ${visit.lab_order.panels.join(", ")}` : ""}
                {" — "}
                {LAB_ORDER_STATUS_LABELS[visit.lab_order.status]}
              </p>
            </div>
          )}

          {/* Live Lab Results Tracker */}
          {loadingLabs ? (
            <div className="py-2 text-center text-muted-foreground text-[11px] flex items-center justify-center gap-1.5">
              <LoaderCircle className="size-3.5 animate-spin text-primary" /> Loading lab results…
            </div>
          ) : (
            labResults.length > 0 && <LabResultsTracker results={labResults} />
          )}

          {visit.prescription && <PrescriptionTemplate session={visit} />}
          {visit.referral && <ReferralTemplate session={visit} />}
          {(visit.prescription || visit.referral) && (
            <DocumentActions label={visit.prescription ? "prescription" : "referral"} />
          )}

          {!visit.prescription &&
            !visit.referral &&
            !visit.diagnosis_notes &&
            !visit.lab_order &&
            labResults.length === 0 && (
              <p className="text-muted-foreground">
                No clinical documents or lab results were issued for this visit.
              </p>
            )}
        </div>
      )}
    </div>
  );
}

function ReferralCta() {
  return (
    <div className="rounded-2xl border bg-gradient-to-br from-primary/10 via-primary/5 to-success/10 p-4 shadow-card">
      <p className="text-xs font-bold flex items-center gap-1.5">
        <Gift className="size-4 text-primary" /> Invite comrades, earn KSh 30 credit
      </p>
      <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
        Your friends get KSh 50 off their first consult (KSh 100 vs 150). You get KSh 30 credit when
        they complete. Campus ambassadors get leaderboard boosts.
      </p>
      <Link
        to="/referrals"
        className="mt-2 inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-[11px] font-bold text-primary-foreground hover:bg-primary/90"
      >
        Open referral dashboard →
      </Link>
    </div>
  );
}

function VisitsRouteComponent() {
  const { patient, loading, signOut } = usePatientAuth();

  const [visits, setVisits] = useState<ConsultSession[] | null>(null);
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [linkInput, setLinkInput] = useState("");
  const [linking, setLinking] = useState(false);
  const [linkNotice, setLinkNotice] = useState<string | null>(null);

  const loadVisits = useCallback(async (patientId: string) => {
    setFetching(true);
    setFetchError(null);
    try {
      const { data, error } = await supabase
        .from("consultations")
        .select("*")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false });
      if (error) {
        setFetchError(error.message);
        setVisits([]);
      } else {
        setVisits(((data ?? []) as ConsultationRow[]).map(mapConsultationRow));
      }
    } catch (err) {
      console.warn("Visits load notice:", err);
      setFetchError("Could not load your visits. Please try again.");
      setVisits([]);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (patient) {
      void loadVisits(patient.id);
    } else {
      setVisits(null);
    }
  }, [patient, loadVisits]);

  // Claim older visits (created before the patient had an account) by phone number OR email.
  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient) return;
    setLinking(true);
    setLinkNotice(null);
    try {
      const cleaned = linkInput.trim().toLowerCase();
      const cleanedPhone = cleaned.replace(/\s/g, "");
      const searchParam = cleanedPhone.length >= 9 ? cleanedPhone.slice(-9) : cleaned;

      const { error } = await supabase
        .from("consultations")
        .update({ patient_id: patient.id })
        .or(`patient_phone.ilike.%${searchParam}%,patient_email.ilike.${cleaned}`)
        .is("patient_id", null);

      if (error) {
        setLinkNotice(`Could not link visits: ${error.message}`);
      } else {
        setLinkNotice(
          "Done! Any past visits matching that phone number or email are now linked to your account.",
        );
        await loadVisits(patient.id);
      }
    } catch (err) {
      console.warn("Visit linking notice:", err);
      setLinkNotice("Could not link visits right now. Please try again.");
    } finally {
      setLinking(false);
    }
  };

  return (
    <StudentLayout subtitle="Your consultation history, safe on your account">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-bold sm:text-xl flex items-center gap-2">
            <History className="size-5 text-primary" />
            My Visits
          </h2>
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            <ArrowLeft className="size-3.5" />
            Back to clinic
          </Link>
        </div>

        {loading ? (
          <div className="rounded-2xl border bg-card p-6 text-center shadow-card">
            <LoaderCircle className="mx-auto size-5 animate-spin text-primary" />
            <p className="mt-2 text-xs text-muted-foreground">Checking your session…</p>
          </div>
        ) : !patient ? (
          <LoginCard />
        ) : (
          <>
            <div className="flex items-center justify-between gap-2 rounded-2xl border bg-card p-4 shadow-card">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Signed in as</p>
                <p className="text-sm font-semibold truncate">{patient.email ?? "Patient"}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs shrink-0"
                onClick={() => void signOut()}
              >
                <LogOut className="size-3.5" />
                Sign out
              </Button>
            </div>

            <ReferralCta />

            {fetching && (
              <div className="rounded-2xl border bg-card p-6 text-center shadow-card">
                <LoaderCircle className="mx-auto size-5 animate-spin text-primary" />
                <p className="mt-2 text-xs text-muted-foreground">Loading your visits…</p>
              </div>
            )}

            {fetchError && (
              <p className="rounded-lg border border-destructive bg-destructive/10 p-2.5 text-xs text-destructive">
                {fetchError}
              </p>
            )}

            {!fetching && visits && visits.length === 0 && (
              <div className="rounded-2xl border bg-card p-6 text-center shadow-card space-y-2">
                <CheckCircle2 className="mx-auto size-5 text-muted-foreground" />
                <p className="text-sm font-semibold">No visits on this account yet</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  New consultations you start while signed in are saved here automatically. Had
                  visits before creating this account? Link them below with the phone number or
                  email you used at intake.
                </p>
              </div>
            )}

            {!fetching && visits && visits.length > 0 && (
              <div className="space-y-3">
                {visits.map((v) => (
                  <VisitCard key={v.id} visit={v} />
                ))}
              </div>
            )}

            <form
              onSubmit={handleLink}
              className="rounded-2xl border bg-card p-4 shadow-card space-y-3"
            >
              <p className="text-sm font-semibold flex items-center gap-1.5">
                <Link2 className="size-4 text-primary" />
                Link past visits to this account
              </p>
              <p className="text-xs text-muted-foreground">
                Enter the phone number or email address you used during intake and we will attach
                those visits to your account.
              </p>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={linkInput}
                  onChange={(e) => setLinkInput(e.target.value)}
                  placeholder="Phone (0712345678) or Email"
                  required
                  className="flex-1"
                />
                <Button type="submit" disabled={linking} className="text-xs">
                  {linking ? "Linking…" : "Link visits"}
                </Button>
              </div>
              {linkNotice && <p className="text-xs text-muted-foreground">{linkNotice}</p>}
            </form>
          </>
        )}
      </div>
    </StudentLayout>
  );
}
